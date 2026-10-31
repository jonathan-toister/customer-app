import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError, Customer, CustomerInput, CustomerSort } from './customer.model';

// Relative URL: the dev server proxies /api to the Express server (proxy.conf.json).
const CUSTOMERS_URL = '/api/customers';

const UNREACHABLE: ApiError = {
  code: 'UNKNOWN',
  message: "Can't reach the server. Please try again.",
};

/** Thin HTTP wrapper: no state, no retries. Every error leaves here as an ApiError. */
@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);

  list(q: string, sort: CustomerSort): Observable<Customer[]> {
    let params = new HttpParams().set('sort', sort.field).set('order', sort.order);
    if (q !== '') {
      params = params.set('q', q);
    }
    return this.http.get<Customer[]>(CUSTOMERS_URL, { params }).pipe(catchError(rethrowAsApiError));
  }

  create(input: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(CUSTOMERS_URL, input).pipe(catchError(rethrowAsApiError));
  }

  update(id: string, input: CustomerInput): Observable<Customer> {
    return this.http
      .put<Customer>(`${CUSTOMERS_URL}/${encodeURIComponent(id)}`, input)
      .pipe(catchError(rethrowAsApiError));
  }

  reset(): Observable<void> {
    return this.http.post<void>(`${CUSTOMERS_URL}/reset`, null).pipe(catchError(rethrowAsApiError));
  }
}

function rethrowAsApiError(err: unknown): Observable<never> {
  return throwError(() => toApiError(err));
}

/**
 * Recognise errors by the shape of the body, not by status code. Behind the dev proxy, a stopped
 * server comes back as a 5xx with no JSON body, not as status 0. See docs/ERROR-HANDLING.md.
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse && isApiErrorBody(err.error)) {
    return err.error.error;
  }
  return UNREACHABLE;
}

function isApiErrorBody(body: unknown): body is { error: ApiError } {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false;
  }
  const error = body.error;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
