import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, debounceTime, filter, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { CustomerApiService } from './customer-api.service';
import { ApiError, Customer, CustomerInput, CustomerSort, DEFAULT_SORT } from './customer.model';

interface ListParams {
  q: string;
  sort: CustomerSort;
}

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
    customers: signal<Customer[]>([]),
    loading: signal(false),
    error: signal<ApiError | null>(null),
    query: signal(''),
    sort: signal<CustomerSort>(DEFAULT_SORT),
  };

  readonly customers = this.state.customers.asReadonly();
  readonly loading = this.state.loading.asReadonly();
  readonly error = this.state.error.asReadonly();
  /** Raw search text, updated on every keystroke (what the input shows). */
  readonly query = this.state.query.asReadonly();
  readonly sort = this.state.sort.asReadonly();

  readonly isEmpty = computed(() => this.customers().length === 0);
  readonly hasQuery = computed(() => this.query().trim() !== '');
  /** Loading with nothing on screen yet: the only time the page shows a full spinner. */
  readonly initialLoad = computed(() => this.loading() && this.isEmpty());

  private readonly keystrokes$ = new Subject<string>();
  private readonly requests$ = new Subject<ListParams>();
  private readonly settled$ = new Subject<void>();
  private lastRequest: ListParams = { q: '', sort: DEFAULT_SORT };

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
      .subscribe(() => this.fetch());

    this.requests$
      .pipe(
        tap(() => {
          this.state.loading.set(true);
          this.state.error.set(null);
        }),
        // A new request cancels the one still in flight, so a slow old response can't overwrite newer results.
        switchMap(({ q, sort }) =>
          this.api.list(q, sort).pipe(
            tap((customers) => {
              this.state.customers.set(customers);
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
    this.fetch();
  }

  /** Sort changes are single clicks too, so there's no debounce. */
  setSort(sort: CustomerSort): void {
    this.state.sort.set(sort);
    this.fetch();
  }

  reload(): void {
    this.fetch();
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
    this.fetch();
  }

  private fetch(): void {
    this.lastRequest = { q: this.query().trim(), sort: this.sort() };
    this.requests$.next(this.lastRequest);
  }
}
