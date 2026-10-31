// Types from docs/API.md. Kept in sync by hand with server/src (see DECISIONS.md).

export type CustomerStatus = 'active' | 'inactive' | 'pending';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
}

export type CustomerInput = Pick<Customer, 'name' | 'email' | 'status'>;

export type SortField = 'name' | 'email' | 'status' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface CustomerSort {
  field: SortField;
  order: SortOrder;
}

export const DEFAULT_SORT: CustomerSort = { field: 'createdAt', order: 'desc' };

export const DEFAULT_PAGE_SIZE = 10;

/** What the list request asks for. `page` starts at 1, like the API. */
export interface CustomerListParams {
  q: string;
  sort: CustomerSort;
  page: number;
  pageSize: number;
}

/** One page of the list, as the API returns it. `total` counts every match, not just this page. */
export interface CustomerPage {
  items: Customer[];
  total: number;
  /** The page the server actually served: a page past the end comes back as the last page. */
  page: number;
  pageSize: number;
}

/** The server's error codes, plus the client-only 'UNKNOWN' (see docs/ERROR-HANDLING.md). */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_TAKEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'SIMULATED_FAILURE'
  | 'INTERNAL'
  | 'UNKNOWN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Keyed by input field name. A plain string record, because the dialog must cope with keys it doesn't know. */
  fields?: Record<string, string>;
}
