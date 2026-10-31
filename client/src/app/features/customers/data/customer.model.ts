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
