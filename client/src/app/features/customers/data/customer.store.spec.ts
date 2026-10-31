import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CustomerApiService } from './customer-api.service';
import { ApiError, Customer, CustomerInput, CustomerListParams, CustomerPage } from './customer.model';
import { CustomerStore } from './customer.store';

const ANN: Customer = {
  id: '1',
  name: 'Ann Taylor',
  email: 'ann.taylor@example.com',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const BOB: Customer = { ...ANN, id: '2', name: 'Bob Brown', email: 'bob.brown@example.com' };
const INPUT: CustomerInput = { name: 'Ann Taylor', email: 'ann.taylor@example.com', status: 'active' };
const SERVER_DOWN: ApiError = { code: 'UNKNOWN', message: "Can't reach the server. Please try again." };

/** One call to api.list(). The test decides when (and how) its response arrives. */
interface ListCall {
  params: CustomerListParams;
  response: Subject<CustomerPage>;
}

function setup() {
  const calls: ListCall[] = [];
  const api = {
    list: vi.fn((params: CustomerListParams) => {
      const response = new Subject<CustomerPage>();
      calls.push({ params, response });
      return response;
    }),
    create: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
  };
  TestBed.configureTestingModule({ providers: [{ provide: CustomerApiService, useValue: api }] });
  const store = TestBed.inject(CustomerStore);
  const lastCall = () => calls[calls.length - 1];
  return { store, api, calls, lastCall };
}

/** Answers a list call. Defaults to one customer on page 1. */
function respond(call: ListCall, page: Partial<CustomerPage> = {}): void {
  call.response.next({ items: [ANN], total: 1, page: call.params.page, pageSize: call.params.pageSize, ...page });
  call.response.complete();
}

/** Types into the search box and waits for the debounce. */
function type(store: CustomerStore, text: string): void {
  store.setQuery(text);
  vi.advanceTimersByTime(300);
}

describe('CustomerStore', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('search', () => {
    it('sends one request once typing pauses, with the last text', () => {
      const { store, calls } = setup();

      store.setQuery('a');
      vi.advanceTimersByTime(100);
      store.setQuery('an');
      vi.advanceTimersByTime(100);
      store.setQuery('ann');
      expect(calls).toHaveLength(0);

      vi.advanceTimersByTime(300);
      expect(calls).toHaveLength(1);
      expect(calls[0].params.q).toBe('ann');
    });

    it('does not search again when only a space was added', () => {
      const { store, calls } = setup();

      type(store, 'ann');
      respond(calls[0]);
      type(store, 'ann ');

      expect(calls).toHaveLength(1);
    });

    it('keeps only the newest results when an older request answers late', () => {
      const { store, calls } = setup();

      type(store, 'a');
      type(store, 'bob');
      respond(calls[1], { items: [BOB] });
      respond(calls[0], { items: [ANN] });

      expect(store.customers()).toEqual([BOB]);
    });

    it('shows the error, stops loading, and still searches after a failed request', () => {
      const { store, calls } = setup();

      type(store, 'ann');
      calls[0].response.error(SERVER_DOWN);
      expect(store.error()).toEqual(SERVER_DOWN);
      expect(store.loading()).toBe(false);

      type(store, 'bob');
      expect(calls).toHaveLength(2);
      expect(store.error()).toBeNull();
      expect(store.loading()).toBe(true);
    });

    it('tries again when the same text is typed after a failed search', () => {
      const { store, calls } = setup();

      type(store, 'ann');
      calls[0].response.error(SERVER_DOWN);
      store.setQuery('a');
      store.setQuery('an');
      type(store, 'ann');

      expect(calls).toHaveLength(2);
      expect(calls[1].params.q).toBe('ann');
    });

    it('load() resolves instead of rejecting when the API fails', async () => {
      const { store, calls } = setup();

      const loaded = store.load();
      calls[0].response.error(SERVER_DOWN);

      await expect(loaded).resolves.toBeUndefined();
      expect(store.error()).toEqual(SERVER_DOWN);
    });

    it('sorts at once, without waiting for the debounce', () => {
      const { store, calls } = setup();

      store.setSort({ field: 'name', order: 'asc' });

      expect(calls).toHaveLength(1);
      expect(calls[0].params.sort).toEqual({ field: 'name', order: 'asc' });
    });

    it('clears the search at once, without waiting for the debounce', () => {
      const { store, calls } = setup();
      type(store, 'ann');
      respond(calls[0]);

      store.clearQuery();

      expect(calls).toHaveLength(2);
      expect(calls[1].params.q).toBe('');
      expect(store.query()).toBe('');
    });
  });

  describe('saving', () => {
    it('create() resolves when the save works, even if the reload after it fails', async () => {
      const { store, api, calls } = setup();
      api.create.mockReturnValue(of(ANN));

      const created = store.create(INPUT);
      calls[0].response.error(SERVER_DOWN);

      await expect(created).resolves.toEqual(ANN);
      expect(store.error()).toEqual(SERVER_DOWN);
    });

    it('update() reloads the list and rejects when the customer no longer exists', async () => {
      const { store, api, calls } = setup();
      const notFound: ApiError = { code: 'NOT_FOUND', message: 'Customer not found' };
      api.update.mockReturnValue(throwError(() => notFound));

      await expect(store.update('1', INPUT)).rejects.toEqual(notFound);
      expect(calls).toHaveLength(1);
    });

    it('reset() rejects and stops loading when the reset fails', async () => {
      const { store, api, calls } = setup();
      api.reset.mockReturnValue(throwError(() => SERVER_DOWN));

      await expect(store.reset()).rejects.toEqual(SERVER_DOWN);
      expect(store.loading()).toBe(false);
      expect(calls).toHaveLength(0);
    });
  });

  describe('pagination', () => {
    it('asks for the chosen page and page size at once', () => {
      const { store, calls } = setup();

      store.setPage(3, 25);

      expect(calls).toHaveLength(1);
      expect(calls[0].params).toMatchObject({ page: 3, pageSize: 25 });
    });

    it('goes back to page 1 on a new search', () => {
      const { store, calls, lastCall } = setup();
      store.setPage(3, 10);
      respond(calls[0], { total: 40 });

      type(store, 'ann');

      expect(lastCall().params).toMatchObject({ q: 'ann', page: 1, pageSize: 10 });
      expect(store.page()).toBe(1);
    });

    it('goes back to page 1 when the search is cleared', () => {
      const { store, calls, lastCall } = setup();
      type(store, 'a');
      respond(calls[0], { total: 30 });
      store.setPage(3, 10);
      respond(calls[1], { total: 30 });

      store.clearQuery();

      expect(lastCall().params).toMatchObject({ q: '', page: 1 });
    });

    it('goes back to page 1 when the sort changes', () => {
      const { store, calls, lastCall } = setup();
      store.setPage(3, 10);
      respond(calls[0], { total: 40 });

      store.setSort({ field: 'name', order: 'asc' });

      expect(lastCall().params.page).toBe(1);
    });

    it('stores the page the server actually served, not the one asked for', () => {
      const { store, calls } = setup();

      store.setPage(99, 10);
      respond(calls[0], { page: 4, total: 40 });

      expect(store.page()).toBe(4);
    });

    it('counts as empty only when nothing matches at all, not by the items on this page', () => {
      const { store, calls } = setup();

      store.setPage(1, 10);
      respond(calls[0], { items: [], total: 5 });
      expect(store.isEmpty()).toBe(false);

      store.setPage(1, 10);
      respond(calls[1], { items: [], total: 0 });
      expect(store.isEmpty()).toBe(true);
    });

    it('stays on the current page when reloading after a save', async () => {
      const { store, api, calls, lastCall } = setup();
      store.setPage(3, 10);
      respond(calls[0], { total: 40 });
      api.create.mockReturnValue(of(ANN));

      await store.create(INPUT);

      expect(lastCall().params).toMatchObject({ page: 3, pageSize: 10 });
    });

    it('keeps the page size but resets page, search and sort after a reset', async () => {
      const { store, api, calls, lastCall } = setup();
      type(store, 'ann');
      store.setSort({ field: 'name', order: 'asc' });
      store.setPage(3, 25);
      respond(calls[calls.length - 1], { total: 80 });
      api.reset.mockReturnValue(of(undefined));

      await store.reset();

      expect(lastCall().params).toEqual({
        q: '',
        sort: { field: 'createdAt', order: 'desc' },
        page: 1,
        pageSize: 25,
      });
      expect(store.query()).toBe('');
    });
  });

  describe('skipping searches that cannot have results', () => {
    /** Search "zz" and get no one back. */
    function searchWithNoResults(store: CustomerStore, calls: ListCall[]): void {
      type(store, 'zz');
      respond(calls[calls.length - 1], { items: [], total: 0 });
    }

    it('does not call the API for longer text that contains a search with no results', () => {
      const { store, calls } = setup();
      searchWithNoResults(store, calls);

      type(store, 'zzz');
      type(store, 'xzz');
      type(store, 'ZZZ');

      expect(calls).toHaveLength(1);
      // The no-results message reads the query, so it still shows what the user typed.
      expect(store.query()).toBe('ZZZ');
    });

    it('still calls the API for text that does not contain it', () => {
      const { store, calls } = setup();
      searchWithNoResults(store, calls);

      type(store, 'z');

      expect(calls).toHaveLength(2);
    });

    it('searches again after a reload, because the data may have changed', () => {
      const { store, calls } = setup();
      searchWithNoResults(store, calls);

      store.reload();
      respond(calls[1], { total: 1 });
      type(store, 'zzz');

      expect(calls).toHaveLength(3);
    });

    it('searches again after adding a customer', async () => {
      const { store, api, calls } = setup();
      searchWithNoResults(store, calls);
      api.create.mockReturnValue(of(ANN));

      await store.create(INPUT);
      respond(calls[1], { total: 1 });
      type(store, 'zzz');

      expect(calls).toHaveLength(3);
    });

    it('searches again after a reset', async () => {
      const { store, api, calls } = setup();
      searchWithNoResults(store, calls);
      api.reset.mockReturnValue(of(undefined));

      await store.reset();
      respond(calls[1], { total: 40 });
      type(store, 'zzz');

      expect(calls).toHaveLength(3);
    });

    it('never skips sort or page changes', () => {
      const { store, calls } = setup();
      searchWithNoResults(store, calls);
      type(store, 'zzz');

      store.setSort({ field: 'name', order: 'asc' });
      expect(calls).toHaveLength(2);
      expect(calls[1].params.q).toBe('zzz');

      store.setPage(1, 25);
      expect(calls).toHaveLength(3);
    });

    it('skips typing when the whole list is empty, until a reload', () => {
      const { store, calls } = setup();
      store.reload();
      respond(calls[0], { items: [], total: 0 });

      type(store, 'ann');
      expect(calls).toHaveLength(1);

      store.reload();
      respond(calls[1], { total: 3 });
      type(store, 'bob');
      expect(calls).toHaveLength(3);
    });
  });
});
