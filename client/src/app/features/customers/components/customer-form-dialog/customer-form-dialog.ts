import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { ErrorBanner } from '../../../../shared/ui/error-banner/error-banner';
import { ApiError, Customer, CustomerInput, CustomerStatus } from '../../data/customer.model';
import { CustomerStore } from '../../data/customer.store';

export interface CustomerFormDialogData {
  /** Missing → add a new customer. Present → edit this one. */
  customer?: Customer;
}

/** `undefined` means the dialog was cancelled. */
export type CustomerFormDialogResult =
  { kind: 'saved'; customer: Customer } | { kind: 'not-found' } | undefined;

const STATUSES: { value: CustomerStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

/**
 * Add / edit form. It saves through the store itself (not the page), so it can stay open and show
 * server errors next to the right field. See docs/ERROR-HANDLING.md.
 */
@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    ErrorBanner,
  ],
  templateUrl: './customer-form-dialog.html',
  styleUrl: './customer-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormDialog {
  private readonly data = inject<CustomerFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<CustomerFormDialog, CustomerFormDialogResult>>(MatDialogRef);
  private readonly store = inject(CustomerStore);

  protected readonly isEdit = this.data.customer !== undefined;
  protected readonly statuses = STATUSES;

  // nonNullable: reset() returns each control to its initial value instead of null,
  // so the value type is `string`, not `string | null`.
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [
      this.data.customer?.name ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: [this.data.customer?.email ?? '', [Validators.required, Validators.email]],
    status: [this.data.customer?.status ?? ('active' as CustomerStatus), Validators.required],
  });

  protected readonly saving = signal(false);
  /** Errors that don't belong to one field (server down, 500, an unknown field key). */
  protected readonly generalError = signal<string | null>(null);

  protected async submit(): Promise<void> {
    // Enter or a double click while a save is running must not send a second request.
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Read the values before disable(): disabled controls are left out of form.value.
    const input: CustomerInput = this.form.getRawValue();
    this.generalError.set(null);
    this.setSaving(true);

    try {
      const customer = await this.save(input);
      this.dialogRef.close({ kind: 'saved', customer });
    } catch (error) {
      this.applyServerError(error as ApiError);
    }
  }

  private save(input: CustomerInput): Promise<Customer> {
    const customer = this.data.customer;
    return customer ? this.store.update(customer.id, input) : this.store.create(input);
  }

  /** Follows "Dialog: applying a server error" in docs/ERROR-HANDLING.md. The order matters. */
  private applyServerError(error: ApiError): void {
    // 1. The customer is gone (e.g. reset in another tab): nothing left to edit.
    if (error.code === 'NOT_FOUND') {
      this.dialogRef.close({ kind: 'not-found' });
      return;
    }

    // 2. Enable first. enable() re-runs the validators, which would wipe server errors set before it.
    this.setSaving(false);

    // 3. Put each field message on its control. It clears by itself once the user edits that field.
    let unmatched = false;
    for (const [field, message] of Object.entries(error.fields ?? {})) {
      const control = this.form.get(field);
      if (control) {
        control.setErrors({ server: message });
        control.markAsTouched();
      } else {
        unmatched = true;
      }
    }

    // 4. Anything that couldn't go under a field goes in the general error area.
    if (!error.fields || unmatched) {
      this.generalError.set(error.message);
    }
  }

  private setSaving(saving: boolean): void {
    this.saving.set(saving);
    // No closing by backdrop or Escape mid-save: the save would still happen, with no snackbar after it.
    this.dialogRef.disableClose = saving;
    if (saving) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }
}
