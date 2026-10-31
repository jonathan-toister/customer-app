import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import * as store from './customers.store.js';
import { SEED_CUSTOMERS } from './seed.js';

const DEFAULTS: store.ListQuery = { q: '', sort: 'createdAt', order: 'desc', page: 1, pageSize: 10 };

/** list() with the defaults, overriding only what the test cares about. */
function list(query: Partial<store.ListQuery> = {}): store.CustomerPage {
  return store.list({ ...DEFAULTS, ...query });
}

describe('customers store', () => {
  // The store is module state, so start every test from the seed.
  beforeEach(() => store.reset());

  describe('search', () => {
    it('finds a name anywhere in the text, ignoring case', () => {
      const names = list({ q: 'ANN', pageSize: 100 }).items.map((c) => c.name);
      assert.deepEqual(names.sort(), [
        'Ann Taylor',
        'Anna Garcia',
        'Annabel Lewis',
        'Dianne Green',
        'Hannah Moore',
        'Joanne Davis',
      ]);
    });

    it('finds by email too', () => {
      const result = list({ q: '@mail.test', pageSize: 100 });
      assert.ok(result.total > 0);
      assert.ok(result.items.every((c) => c.email.endsWith('@mail.test')));
    });

    it('returns page 1 with no items when nothing matches', () => {
      assert.deepEqual(list({ q: 'zzzz', page: 3 }), { items: [], total: 0, page: 1, pageSize: 10 });
    });
  });

  describe('sort', () => {
    it('sorts newest first by default', () => {
      assert.equal(list().items[0].name, 'Ann Taylor');
    });

    it('sorts by name A to Z, and Z to A', () => {
      const ascending = list({ sort: 'name', order: 'asc', pageSize: 100 }).items.map((c) => c.name);
      const descending = list({ sort: 'name', order: 'desc', pageSize: 100 }).items.map((c) => c.name);
      assert.equal(ascending[0], 'Adam Campbell');
      assert.deepEqual(descending, [...ascending].reverse());
    });

    it('does not reorder the stored list', () => {
      list({ sort: 'name', order: 'asc' });
      assert.equal(list().items[0].name, 'Ann Taylor');
    });
  });

  describe('pages', () => {
    it('splits the 40 seed customers into 4 pages of 10', () => {
      const pages = [1, 2, 3, 4].map((page) => list({ page }));
      assert.ok(pages.every((p) => p.items.length === 10 && p.total === 40));
      const ids = new Set(pages.flatMap((p) => p.items.map((c) => c.id)));
      assert.equal(ids.size, 40);
    });

    it('serves the last page when asked for a page past the end', () => {
      const result = list({ page: 99 });
      assert.equal(result.page, 4);
      assert.deepEqual(result.items, list({ page: 4 }).items);
    });

    it('gives a short last page when the size does not divide evenly', () => {
      const result = list({ page: 2, pageSize: 25 });
      assert.equal(result.items.length, 15);
      assert.equal(result.total, 40);
    });
  });

  describe('changes', () => {
    it('adds a customer with a new id and a creation date, shown first by default', () => {
      const created = store.create({ name: 'New Person', email: 'new@example.com', status: 'pending' });
      assert.ok(created.id);
      assert.ok(created.createdAt);
      assert.equal(list().items[0].id, created.id);
      assert.equal(list().total, 41);
    });

    it('updates name, email and status, but keeps the id and creation date', () => {
      const original = SEED_CUSTOMERS[0];
      const updated = store.update(original.id, { name: 'Ann T', email: 'ann.t@example.com', status: 'inactive' });
      assert.deepEqual(updated, { ...original, name: 'Ann T', email: 'ann.t@example.com', status: 'inactive' });
    });

    it('returns undefined when updating a customer that does not exist', () => {
      assert.equal(store.update('nope', { name: 'X Y', email: 'x@y.com', status: 'active' }), undefined);
    });

    it("lets a customer keep their own email, but not take someone else's", () => {
      const [ann, liam] = SEED_CUSTOMERS;
      assert.equal(store.emailTaken(ann.email, ann.id), false);
      assert.equal(store.emailTaken(ann.email, liam.id), true);
      assert.equal(store.emailTaken(ann.email), true);
    });

    it('reset brings back the seed data, undoing adds and edits', () => {
      store.create({ name: 'New Person', email: 'new@example.com', status: 'pending' });
      store.update(SEED_CUSTOMERS[0].id, { name: 'Changed', email: 'changed@example.com', status: 'inactive' });

      store.reset();

      assert.equal(list().total, 40);
      assert.deepEqual(store.getById(SEED_CUSTOMERS[0].id), SEED_CUSTOMERS[0]);
    });
  });
});
