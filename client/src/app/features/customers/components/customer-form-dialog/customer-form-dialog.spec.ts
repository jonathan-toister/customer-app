import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ApiError, Customer } from '../../data/customer.model';
import { CustomerStore } from '../../data/customer.store';
import { CustomerFormDialog, CustomerFormDialogData } from './customer-form-dialog';

const ANN: Customer = {
  id: '1',
  name: 'Ann Taylor',
  email: 'ann.taylor@example.com',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Lets the dialog's async submit() finish after the store's promise settles. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('CustomerFormDialog', () => {
  function setup(data: CustomerFormDialogData = {}) {
    const dialogRef = { id: 'test-dialog', close: vi.fn(), disableClose: false };
    const store = { create: vi.fn(), update: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CustomerFormDialog],
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: CustomerStore, useValue: store },
      ],
    });
    const fixture = TestBed.createComponent(CustomerFormDialog);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    const fill = (field: 'name' | 'email', value: string) => {
      const input = element.querySelector<HTMLInputElement>(`input[formcontrolname="${field}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await settle();
      fixture.detectChanges();
    };
    const fieldText = (field: 'name' | 'email') =>
      element.querySelector(`input[formcontrolname="${field}"]`)!.closest('mat-form-field')!.textContent;

    return { fixture, element, dialogRef, store, fill, submit, fieldText };
  }

  function fillValidForm(fill: (field: 'name' | 'email', value: string) => void): void {
    fill('name', 'Ann Taylor');
    fill('email', 'ann.taylor@example.com');
  }

  it('does not save an invalid form, and shows why', async () => {
    const { store, submit, fieldText } = setup();

    await submit();

    expect(store.create).not.toHaveBeenCalled();
    expect(fieldText('name')).toContain('Name is required');
  });

  it('closes with the saved customer when adding works', async () => {
    const { store, dialogRef, fill, submit } = setup();
    store.create.mockResolvedValue(ANN);

    fillValidForm(fill);
    await submit();

    expect(store.create).toHaveBeenCalledWith({
      name: 'Ann Taylor',
      email: 'ann.taylor@example.com',
      status: 'active',
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'saved', customer: ANN });
  });

  it('cannot be closed by Escape or the backdrop while saving', async () => {
    const { store, dialogRef, element, fill, submit } = setup();
    store.create.mockReturnValue(new Promise(() => {})); // never answers

    fillValidForm(fill);
    await submit();

    expect(dialogRef.disableClose).toBe(true);
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Saving…');
  });

  it('shows "email taken" under the email field, after the form is editable again', async () => {
    const { store, dialogRef, fixture, element, fill, submit, fieldText } = setup();
    const emailTaken: ApiError = {
      code: 'EMAIL_TAKEN',
      message: 'A customer with this email already exists',
      fields: { email: 'Email is already in use' },
    };
    store.create.mockRejectedValue(emailTaken);

    fillValidForm(fill);
    await submit();

    expect(fieldText('email')).toContain('Email is already in use');
    expect(element.querySelector<HTMLInputElement>('input[formcontrolname="email"]')!.disabled).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(dialogRef.disableClose).toBe(false);

    // The server message goes away as soon as the user edits that field.
    fill('email', 'ann.t@example.com');
    fixture.detectChanges();
    expect(fieldText('email')).not.toContain('Email is already in use');
  });

  it('shows the message in the general error area when a field has no matching input', async () => {
    const { store, element, fill, submit } = setup();
    store.create.mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      fields: { phone: 'Phone is required' },
    } satisfies ApiError);

    fillValidForm(fill);
    await submit();

    expect(element.querySelector('app-error-banner')?.textContent).toContain('Some fields are invalid');
  });

  it('shows the message in the general error area when the server names no fields', async () => {
    const { store, element, fill, submit } = setup();
    store.create.mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      fields: {},
    } satisfies ApiError);

    fillValidForm(fill);
    await submit();

    expect(element.querySelector('app-error-banner')?.textContent).toContain('Some fields are invalid');
  });

  it('shows a server error without fields in the general error area, and keeps the values', async () => {
    const { store, element, fill, submit } = setup();
    store.create.mockRejectedValue({
      code: 'UNKNOWN',
      message: "Can't reach the server. Please try again.",
    } satisfies ApiError);

    fillValidForm(fill);
    await submit();

    expect(element.querySelector('app-error-banner')?.textContent).toContain("Can't reach the server");
    expect(element.querySelector<HTMLInputElement>('input[formcontrolname="name"]')!.value).toBe('Ann Taylor');
  });

  it('closes with "not-found" when the customer being edited no longer exists', async () => {
    const { store, dialogRef, submit } = setup({ customer: ANN });
    store.update.mockRejectedValue({ code: 'NOT_FOUND', message: 'Customer not found' } satisfies ApiError);

    await submit();

    expect(store.update).toHaveBeenCalledWith('1', {
      name: ANN.name,
      email: ANN.email,
      status: ANN.status,
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'not-found' });
  });
});
