import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, filter, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { CustomerApiService } from './customer-api.service';
import {
  ApiError,
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerSort,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
} from './customer.model';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Single source of truth for the customers list. Components read the signals and call the methods;
 * only this class talks to CustomerApiService.
 */
@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly api = inject(CustomerApiService);

  // Writable state stays private. Components get read-only versions below.
  private readonly state = {
    /** The customers on the current page only. */
    customers: signal<Customer[]>([]),
    /** How many customers match the search, across all pages. */
    total: signal(0),
    /** Starts at 1, like the API. */
    page: signal(1),
    pageSize: signal(DEFAULT_PAGE_SIZE),
    loading: signal(false),
    error: signal<ApiError | null>(null),
    query: signal(''),
    sort: signal<CustomerSort>(DEFAULT_SORT),
    /** True once any list response has arrived. Never goes back to false. */
    hasLoaded: signal(false),
  };

  readonly customers = this.state.customers.asReadonly();
  readonly total = this.state.total.asReadonly();
  readonly page = this.state.page.asReadonly();
  readonly pageSize = this.state.pageSize.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly error = this.state.error.asReadonly();
  /** Raw search text, updated on every keystroke (what the input shows). */
  readonly query = this.state.query.asReadonly();
  readonly sort = this.state.sort.asReadonly();

  /** Nothing matches at all (not just an empty page: the server never returns a page past the end). */
  readonly isEmpty = computed(() => this.total() === 0);
  readonly hasQuery = computed(() => this.query().trim() !== '');
  /**
   * Loading before any list has arrived: the only time the page shows a full spinner.
   * Not "loading and empty": that would also flash the spinner while refining a search with no results.
   */
  readonly initialLoad = computed(() => this.loading() && !this.state.hasLoaded());

  private readonly keystrokes$ = new Subject<string>();
  private readonly requests$ = new Subject<CustomerListParams>();
  private readonly settled$ = new Subject<void>();
  private lastRequest: CustomerListParams = {
    q: '',
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  constructor() {
    this.keystrokes$
      .pipe(
        // Compare trimmed text, so "ann" and "ann " count as the same search.
        map((text) => text.trim()),
        // Wait until the user pauses typing, so "annabel" is one request, not seven.
        debounceTime(SEARCH_DEBOUNCE_MS),
        // Skip when the term equals what was last requested. This works like distinctUntilChanged,
        // but compares against the last *request*, which clear, reset and sort changes also update.
        filter((term) => term !== this.lastRequest.q),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.fetchFirstPage());

    this.requests$
      .pipe(
        tap(() => {
          this.state.loading.set(true);
          this.state.error.set(null);
        }),
        // A new request cancels the one still in flight, so a slow old response can't overwrite newer results.
        switchMap((params) =>
          this.api.list(params).pipe(
            tap(({ items, total, page }) => {
              this.state.customers.set(items);
              this.state.total.set(total);
              // From the response, not the request: a page past the end comes back as the last page.
              this.state.page.set(page);
              this.state.hasLoaded.set(true);
              this.state.loading.set(false);
              this.settled$.next();
            }),
            // Inside switchMap, so a failed request ends only that request, not the whole pipeline.
            // (Outside, the error would complete the stream and search would stop working.)
            catchError((error: ApiError) => {
              this.state.error.set(error);
              this.state.loading.set(false);
              this.settled$.next();
              return EMPTY;
            }),
            // No finalize() for loading=false: it would also run when switchMap cancels this
            // request, turning loading off while the newer request is still running.
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /** First fetch, awaited by the app initializer. Never rejects: failures end up in `error`. */
  load(): Promise<void> {
    const firstResult = firstValueFrom(this.settled$);
    this.fetch();
    return firstResult;
  }

  setQuery(text: string): void {
    this.state.query.set(text);
    this.keystrokes$.next(text);
  }

  /** Clearing is a single click, so it searches immediately instead of waiting for the debounce. */
  clearQuery(): void {
    this.setQuery('');
    this.fetchFirstPage();
  }

  /** Sort changes are single clicks too, so there's no debounce. */
  setSort(sort: CustomerSort): void {
    this.state.sort.set(sort);
    this.fetchFirstPage();
  }

  /** From the paginator. A click, so no debounce either. */
  setPage(page: number, pageSize: number): void {
    this.state.page.set(page);
    this.state.pageSize.set(pageSize);
    this.fetch();
  }

  /** Same search, sort and page. Used by "Try again" and after a save. */
  reload(): void {
    this.fetch();
  }

  /** Hides the error banner. The next request clears the error anyway; this is for the close button. */
  dismissError(): void {
    this.state.error.set(null);
  }

  /** Resolves once the save succeeds, even if the reload after it fails. Rejects with ApiError. */
  create(input: CustomerInput): Promise<Customer> {
    return firstValueFrom(this.api.create(input).pipe(tap(() => this.reload())));
  }

  /** Like create(). On NOT_FOUND it also reloads, so the missing customer disappears from the list. */
  update(id: string, input: CustomerInput): Promise<Customer> {
    return firstValueFrom(
      this.api.update(id, input).pipe(
        tap({
          next: () => this.reload(),
          error: (error: ApiError) => {
            if (error.code === 'NOT_FOUND') {
              this.reload();
            }
          },
        }),
      ),
    );
  }

  /** Restores the seed data and returns the list to its default view. Rejects with ApiError. */
  async reset(): Promise<void> {
    // Show the progress bar from the start, not only during the reload after it.
    this.state.loading.set(true);
    try {
      await firstValueFrom(this.api.reset());
    } catch (error) {
      this.state.loading.set(false);
      throw error;
    }
    this.state.sort.set(DEFAULT_SORT);
    this.setQuery('');
    this.fetchFirstPage();
  }

  /** A new search or sort shows different customers, so page 3 of the old list means nothing: start at 1. */
  private fetchFirstPage(): void {
    this.state.page.set(1);
    this.fetch();
  }

  private fetch(): void {
    this.lastRequest = {
      q: this.query().trim(),
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize(),
    };
    this.requests$.next(this.lastRequest);
  }
}
