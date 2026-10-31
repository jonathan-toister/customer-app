import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppDialog } from '../../../shared/ui/dialog-shell/app-dialog.service';
import { NotificationService } from '../../../shared/ui/notification/notification.service';
import { CustomerFormDialogResult } from '../components/customer-form-dialog/customer-form-dialog';
import { ApiError, Customer, DEFAULT_PAGE_SIZE, DEFAULT_SORT } from '../data/customer.model';
import { CustomerStore } from '../data/customer.store';
import { CustomersPage } from './customers-page';

const ANN: Customer = {
  id: '1',
  name: 'Ann Taylor',
  email: 'ann.taylor@example.com',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** The store's public signals, as plain writable signals the test can set. */
function createFakeStore() {
  const customers = signal<Customer[]>([ANN]);
  const total = signal(1);
  const query = signal('');
  const loading = signal(false);
  return {
    customers,
    total,
    query,
    loading,
    page: signal(1),
    pageSize: signal(DEFAULT_PAGE_SIZE),
    error: signal<ApiError | null>(null),
    sort: signal(DEFAULT_SORT),
    isEmpty: computed(() => total() === 0),
    hasQuery: computed(() => query().trim() !== ''),
    initialLoad: signal(false),
    setQuery: vi.fn(),
    clearQuery: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    reload: vi.fn(),
    dismissError: vi.fn(),
    reset: vi.fn(),
  };
}

describe('CustomersPage', () => {
  function setup({ mobile = false, dialogResult = undefined as CustomerFormDialogResult } = {}) {
    const store = createFakeStore();
    const breakpointObserver = {
      observe: () => of({ matches: mobile, breakpoints: {} }),
      isMatched: () => mobile,
    };
    const dialog = { open: vi.fn(() => ({ closed: of(dialogResult) })) };
    TestBed.configureTestingModule({
      imports: [CustomersPage],
      providers: [
        { provide: CustomerStore, useValue: store },
        { provide: BreakpointObserver, useValue: breakpointObserver },
        { provide: AppDialog, useValue: dialog },
      ],
    });
    const fixture = TestBed.createComponent(CustomersPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, element, store, dialog };
  }

  it('shows the list in a table, with a paginator, on desktop', () => {
    const { element } = setup();

    expect(element.querySelector('app-customer-table')).not.toBeNull();
    expect(element.querySelector('app-customer-cards')).toBeNull();
    expect(element.querySelector('mat-paginator')).not.toBeNull();
  });

  it('always shows cards on a small screen', () => {
    const { element } = setup({ mobile: true });

    expect(element.querySelector('app-customer-cards')).not.toBeNull();
    expect(element.querySelector('app-customer-table')).toBeNull();
  });

  it('shows "no customers match" with the search text, and no paginator, when a search finds no one', () => {
    const { fixture, element, store } = setup();

    store.query.set('zz ');
    store.customers.set([]);
    store.total.set(0);
    fixture.detectChanges();

    expect(element.querySelector('app-empty-state')?.textContent).toContain('No customers match “zz”');
    expect(element.querySelector('mat-paginator')).toBeNull();
  });

  it('shows "no customers yet" when the list is empty without a search', () => {
    const { fixture, element, store } = setup();

    store.customers.set([]);
    store.total.set(0);
    fixture.detectChanges();

    expect(element.querySelector('app-empty-state')?.textContent).toContain('No customers yet');
  });

  it('keeps the list and shows a banner when a refresh fails', () => {
    const { fixture, element, store } = setup();

    store.error.set({ code: 'UNKNOWN', message: "Can't reach the server. Please try again." });
    fixture.detectChanges();

    expect(element.querySelector('app-error-banner')?.textContent).toContain("Can't reach the server");
    expect(element.querySelector('app-customer-table')).not.toBeNull();
  });

  it('shows "Customer added" after the add dialog closes with a saved customer', () => {
    const { element } = setup({ dialogResult: { kind: 'saved', customer: ANN } });
    const addButton = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add customer'),
    )!;

    addButton.click();

    expect(TestBed.inject(NotificationService).current()).toEqual({
      message: 'Customer added',
      kind: 'success',
    });
  });

  it('shows no notification when the dialog is cancelled', () => {
    const { element } = setup({ dialogResult: undefined });
    const addButton = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add customer'),
    )!;

    addButton.click();

    expect(TestBed.inject(NotificationService).current()).toBeNull();
  });
});
