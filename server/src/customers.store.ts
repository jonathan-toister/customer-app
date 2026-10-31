import { randomUUID } from 'node:crypto';
import { SEED_CUSTOMERS, type Customer, type CustomerInput } from './seed.js';

export const SORT_FIELDS = ['name', 'email', 'status', 'createdAt'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface ListQuery {
  q: string;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export interface CustomerPage {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

/** Dev knob: `SEED=empty` starts (and resets) with no customers, to show the client's empty state. */
export const EMPTY_SEED = process.env.SEED === 'empty';

// A deep copy, not the seed array itself. Otherwise create/update would change
// SEED_CUSTOMERS, and reset() would "restore" the edited data.
function freshSeed(): Customer[] {
  return EMPTY_SEED ? [] : structuredClone(SEED_CUSTOMERS);
}

let customers: Customer[] = freshSeed();

function matchesQuery(customer: Customer, q: string): boolean {
  const needle = q.toLowerCase();
  return customer.name.toLowerCase().includes(needle) || customer.email.includes(needle);
}

function compareBy(field: SortField): (a: Customer, b: Customer) => number {
  if (field === 'createdAt') {
    return (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt);
  }
  return (a, b) => a[field].localeCompare(b[field], undefined, { sensitivity: 'base' });
}

export function list({ q, sort, order, page, pageSize }: ListQuery): CustomerPage {
  const compare = compareBy(sort);
  const direction = order === 'asc' ? 1 : -1;

  // filter() returns a new array, so sorting it never reorders the store itself.
  const matches = customers
    .filter((customer) => q === '' || matchesQuery(customer, q))
    .sort((a, b) => direction * compare(a, b));

  // A page past the end becomes the last page (page 1 when nothing matches). See docs/API.md.
  const lastPage = Math.max(1, Math.ceil(matches.length / pageSize));
  const servedPage = Math.min(page, lastPage);
  const start = (servedPage - 1) * pageSize;

  return {
    items: matches.slice(start, start + pageSize),
    total: matches.length,
    page: servedPage,
    pageSize,
  };
}

export function getById(id: string): Customer | undefined {
  return customers.find((customer) => customer.id === id);
}

export function create(input: CustomerInput): Customer {
  const customer: Customer = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  return customer;
}

export function update(id: string, input: CustomerInput): Customer | undefined {
  const index = customers.findIndex((customer) => customer.id === id);
  if (index === -1) {
    return undefined;
  }
  // Only name/email/status come from the input; id and createdAt are kept from the existing record.
  const updated: Customer = { ...customers[index], ...input };
  customers[index] = updated;
  return updated;
}

export function reset(): void {
  customers = freshSeed();
}

// Emails are stored lower-cased, so a plain === here is a case-insensitive comparison.
export function emailTaken(email: string, exceptId?: string): boolean {
  return customers.some((customer) => customer.email === email && customer.id !== exceptId);
}
