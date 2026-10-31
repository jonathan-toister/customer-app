import { CUSTOMER_STATUSES, type CustomerInput } from './seed.js';
import { SORT_FIELDS, SORT_ORDERS, type ListQuery } from './customers.store.js';

export type FieldErrors = Partial<Record<keyof CustomerInput, string>>;

type InputResult = { ok: true; value: CustomerInput } | { ok: false; fields: FieldErrors };
type ListQueryResult = { ok: true; value: ListQuery } | { ok: false; message: string };

// Deliberately basic: something@something.tld. The only real proof is sending an email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isOneOf<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/** A query param that must be a whole number. Missing → the default; anything else that isn't digits → null. */
function wholeNumberParam(value: unknown, defaultValue: number): number | null {
  if (value === undefined) {
    return defaultValue;
  }
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : null;
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateCustomerInput(body: unknown): InputResult {
  const input = isRecord(body) ? body : {};
  const name = trimmedString(input.name);
  const email = trimmedString(input.email).toLowerCase();
  const status = isOneOf(CUSTOMER_STATUSES, input.status) ? input.status : null;

  const fields: FieldErrors = {};
  if (name === '') {
    fields.name = 'Name is required';
  } else if (name.length < 2 || name.length > 100) {
    fields.name = 'Name must be 2–100 characters';
  }
  if (email === '') {
    fields.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    fields.email = 'Enter a valid email address';
  }
  if (status === null) {
    fields.status = 'Status must be active, inactive or pending';
  }

  if (status === null || Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }
  // Only the three editable fields are returned, so an id or createdAt in the body is ignored.
  return { ok: true, value: { name, email, status } };
}

export function parseListQuery(query: Record<string, unknown>): ListQueryResult {
  const sort = query.sort ?? 'createdAt';
  const order = query.order ?? 'desc';

  if (!isOneOf(SORT_FIELDS, sort)) {
    return { ok: false, message: `sort must be one of: ${SORT_FIELDS.join(', ')}` };
  }
  if (!isOneOf(SORT_ORDERS, order)) {
    return { ok: false, message: `order must be one of: ${SORT_ORDERS.join(', ')}` };
  }

  const page = wholeNumberParam(query.page, 1);
  if (page === null || page < 1) {
    return { ok: false, message: 'page must be a whole number, 1 or more' };
  }
  const pageSize = wholeNumberParam(query.pageSize, DEFAULT_PAGE_SIZE);
  if (pageSize === null || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return { ok: false, message: `pageSize must be a whole number from 1 to ${MAX_PAGE_SIZE}` };
  }

  return { ok: true, value: { q: trimmedString(query.q), sort, order, page, pageSize } };
}
