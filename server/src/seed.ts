export const CUSTOMER_STATUSES = ['active', 'inactive', 'pending'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
}

export type CustomerInput = Pick<Customer, 'name' | 'email' | 'status'>;

// Several names share "ann" (Ann, Anna, Annabel, Joanne, Hannah, Dianne) so search is easy to demo.
const FIRST_NAMES = [
  'Ann', 'Liam', 'Anna', 'Noah', 'Joanne', 'Oliver', 'Hannah', 'Elijah', 'Annabel', 'James',
  'Sofia', 'Lucas', 'Mia', 'Mateo', 'Dianne', 'Henry', 'Chloe', 'Leo', 'Grace', 'Ethan',
  'Zoe', 'Daniel', 'Nora', 'Samuel', 'Lily', 'David', 'Ella', 'Jack', 'Maya', 'Owen',
  'Aria', 'Isaac', 'Ruby', 'Gabriel', 'Ivy', 'Julian', 'Clara', 'Felix', 'Iris', 'Adam',
];

const LAST_NAMES = [
  'Taylor', 'Brown', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore', 'Clark', 'Lewis', 'Walker',
  'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell',
];

const EMAIL_DOMAINS = ['example.com', 'example.org', 'mail.test'];

// A fixed pattern instead of random picks, so every restart and reset gives the same data.
const STATUS_PATTERN: CustomerStatus[] = ['active', 'active', 'pending', 'inactive', 'active'];

// Fixed "now", so createdAt values don't change between runs. Customers are spread over ~2 years.
const NEWEST_CREATED_AT = Date.UTC(2026, 9, 1, 9, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function seedId(index: number): string {
  // UUID-shaped like real ids, but stable, so a reset gives every seed customer the same id again.
  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}

function buildSeedCustomer(firstName: string, index: number): Customer {
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const domain = EMAIL_DOMAINS[index % EMAIL_DOMAINS.length];
  const createdAt = NEWEST_CREATED_AT - index * 18 * DAY_MS - (index % 9) * HOUR_MS;

  return {
    id: seedId(index),
    name: `${firstName} ${lastName}`,
    email: `${firstName}.${lastName}@${domain}`.toLowerCase(),
    status: STATUS_PATTERN[index % STATUS_PATTERN.length],
    createdAt: new Date(createdAt).toISOString(),
  };
}

export const SEED_CUSTOMERS: Customer[] = FIRST_NAMES.map(buildSeedCustomer);
