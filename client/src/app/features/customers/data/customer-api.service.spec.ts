import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerApiService, toApiError } from './customer-api.service';
import { ApiError } from './customer.model';

const UNREACHABLE_MESSAGE = "Can't reach the server. Please try again.";

describe('toApiError', () => {
  it('returns our error body unchanged: code, message and fields', () => {
    const body: ApiError = {
      code: 'EMAIL_TAKEN',
      message: 'A customer with this email already exists',
      fields: { email: 'Email is already in use' },
    };
    const response = new HttpErrorResponse({ status: 409, error: { error: body } });

    expect(toApiError(response)).toEqual(body);
  });

  it('turns "no response at all" (status 0) into UNKNOWN', () => {
    const response = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    expect(toApiError(response)).toEqual({ code: 'UNKNOWN', message: UNREACHABLE_MESSAGE });
  });

  it('turns a 5xx with an HTML body (the dev proxy with the server stopped) into UNKNOWN', () => {
    const response = new HttpErrorResponse({ status: 504, error: '<html>Gateway Timeout</html>' });

    expect(toApiError(response).code).toBe('UNKNOWN');
  });

  it('turns a 5xx with an empty body into UNKNOWN', () => {
    const response = new HttpErrorResponse({ status: 500, error: null });

    expect(toApiError(response).code).toBe('UNKNOWN');
  });

  it('turns something that is not an HTTP error at all into UNKNOWN', () => {
    expect(toApiError(new Error('boom')).code).toBe('UNKNOWN');
  });
});

describe('CustomerApiService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(CustomerApiService), http: TestBed.inject(HttpTestingController) };
  }

  it('sends the sort, order, page and page size, and leaves out an empty search', () => {
    const { api, http } = setup();

    api.list({ q: '', sort: { field: 'name', order: 'asc' }, page: 2, pageSize: 25 }).subscribe();

    const request = http.expectOne((req) => req.url === '/api/customers');
    expect(request.request.params.toString()).toBe('sort=name&order=asc&page=2&pageSize=25');
    request.flush({ items: [], total: 0, page: 1, pageSize: 25 });
    http.verify();
  });

  it('sends the search text when there is one', () => {
    const { api, http } = setup();

    api.list({ q: 'ann', sort: { field: 'createdAt', order: 'desc' }, page: 1, pageSize: 10 }).subscribe();

    const request = http.expectOne((req) => req.url === '/api/customers');
    expect(request.request.params.get('q')).toBe('ann');
    request.flush({ items: [], total: 0, page: 1, pageSize: 10 });
  });

  it('fails with an ApiError, never a raw HttpErrorResponse', () => {
    const { api, http } = setup();
    let error: unknown;

    api.create({ name: 'Ann', email: 'ann@example.com', status: 'active' }).subscribe({
      error: (e: unknown) => (error = e),
    });
    http
      .expectOne('/api/customers')
      .flush({ error: { code: 'INTERNAL', message: 'Something went wrong on the server' } }, { status: 500, statusText: 'Error' });

    expect(error).toEqual({ code: 'INTERNAL', message: 'Something went wrong on the server' });
  });
});
