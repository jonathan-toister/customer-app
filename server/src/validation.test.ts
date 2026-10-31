import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseListQuery, validateCustomerInput } from './validation.js';

describe('parseListQuery', () => {
  it('uses the defaults when nothing is sent', () => {
    assert.deepEqual(parseListQuery({}), {
      ok: true,
      value: { q: '', sort: 'createdAt', order: 'desc', page: 1, pageSize: 10 },
    });
  });

  it('reads and trims every param', () => {
    const result = parseListQuery({ q: '  ann ', sort: 'name', order: 'asc', page: '3', pageSize: '25' });
    assert.deepEqual(result, {
      ok: true,
      value: { q: 'ann', sort: 'name', order: 'asc', page: 3, pageSize: 25 },
    });
  });

  for (const page of ['0', '-1', '1.5', 'abc', '']) {
    it(`rejects page=${JSON.stringify(page)}`, () => {
      assert.deepEqual(parseListQuery({ page }), {
        ok: false,
        message: 'page must be a whole number, 1 or more',
      });
    });
  }

  for (const pageSize of ['0', '101', 'ten']) {
    it(`rejects pageSize=${JSON.stringify(pageSize)}`, () => {
      assert.deepEqual(parseListQuery({ pageSize }), {
        ok: false,
        message: 'pageSize must be a whole number from 1 to 100',
      });
    });
  }

  it('accepts the largest page size, 100', () => {
    assert.equal(parseListQuery({ pageSize: '100' }).ok, true);
  });

  it('rejects a page sent twice (?page=1&page=2 arrives as an array)', () => {
    assert.equal(parseListQuery({ page: ['1', '2'] }).ok, false);
  });

  it('rejects an unknown sort field or order', () => {
    assert.equal(parseListQuery({ sort: 'phone' }).ok, false);
    assert.equal(parseListQuery({ order: 'up' }).ok, false);
  });
});

describe('validateCustomerInput', () => {
  it('trims the name and email, and lower-cases the email', () => {
    const result = validateCustomerInput({ name: '  Ann  ', email: ' ANN@Example.COM ', status: 'active' });
    assert.deepEqual(result, { ok: true, value: { name: 'Ann', email: 'ann@example.com', status: 'active' } });
  });

  it('ignores fields the client may not set, like id and createdAt', () => {
    const result = validateCustomerInput({
      id: 'x',
      createdAt: 'yesterday',
      name: 'Ann',
      email: 'ann@example.com',
      status: 'pending',
    });
    assert.deepEqual(result, { ok: true, value: { name: 'Ann', email: 'ann@example.com', status: 'pending' } });
  });

  it('treats a name of only spaces as missing', () => {
    const result = validateCustomerInput({ name: '   ', email: 'ann@example.com', status: 'active' });
    assert.deepEqual(result, { ok: false, fields: { name: 'Name is required' } });
  });

  it('rejects a one-letter name', () => {
    const result = validateCustomerInput({ name: 'A', email: 'ann@example.com', status: 'active' });
    assert.deepEqual(result, { ok: false, fields: { name: 'Name must be 2–100 characters' } });
  });

  it('rejects an email without a dot after the @ (a@b), which the browser check accepts', () => {
    const result = validateCustomerInput({ name: 'Ann', email: 'a@b', status: 'active' });
    assert.deepEqual(result, { ok: false, fields: { email: 'Enter a valid email address' } });
  });

  it('rejects an unknown status', () => {
    const result = validateCustomerInput({ name: 'Ann', email: 'ann@example.com', status: 'vip' });
    assert.deepEqual(result, { ok: false, fields: { status: 'Status must be active, inactive or pending' } });
  });

  it('reports every bad field at once, even for a body that is not an object', () => {
    const result = validateCustomerInput('hello');
    assert.deepEqual(Object.keys(result.ok ? {} : result.fields).sort(), ['email', 'name', 'status']);
  });
});
