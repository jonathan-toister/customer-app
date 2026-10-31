import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { CustomerCards } from '../components/customer-cards/customer-cards';
import {
  CustomerFormDialog,
  CustomerFormDialogData,
  CustomerFormDialogResult,
} from '../components/customer-form-dialog/customer-form-dialog';
import { CustomerTable } from '../components/customer-table/customer-table';
import { CustomerToolbar, CustomerView } from '../components/customer-toolbar/customer-toolbar';
import { ApiError, Customer } from '../data/customer.model';
import { CustomerStore } from '../data/customer.store';

const VIEW_STORAGE_KEY = 'customers.view';
const SNACKBAR_DURATION_MS = 4000;

/** The customers screen: connects the store to the toolbar, the views and the dialogs. */
@Component({
  selector: 'app-customers-page',
  imports: [
    CustomerToolbar,
    CustomerTable,
    CustomerCards,
    LoadingState,
    ErrorState,
    EmptyState,
    MatButton,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  protected readonly store = inject(CustomerStore);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Width only (under 600px), so a phone counts as mobile whichever way it's held.
  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe(Breakpoints.XSmall).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(Breakpoints.XSmall) },
  );

  /** The view the user picked on desktop. Kept on mobile too, so it comes back when the window widens. */
  private readonly selectedView = signal<CustomerView>(readSavedView());

  /** Derived, not stored: on mobile it's always cards, otherwise whatever the user picked. */
  protected readonly activeView = computed(() => (this.isMobile() ? 'cards' : this.selectedView()));

  /** A request is running with results already on screen: show the thin bar, not a full spinner. */
  protected readonly busy = computed(() => this.store.loading() && !this.store.initialLoad());

  /** "12 customers" under the toolbar. Blank while there's no list to count (first load, full-page error). */
  protected readonly resultCountLabel = computed(() => {
    if (this.store.initialLoad() || (this.store.error() && this.store.isEmpty())) {
      return '';
    }
    const count = this.store.customers().length;
    return count === 1 ? '1 customer' : `${count} customers`;
  });

  protected onViewChange(view: CustomerView): void {
    this.selectedView.set(view);
    saveView(view);
  }

  protected openAdd(): void {
    this.openForm(undefined);
  }

  protected openEdit(customer: Customer): void {
    this.openForm(customer);
  }

  /** The dialog does the saving. The page only reports the outcome once it closes. */
  private openForm(customer: Customer | undefined): void {
    // The type arguments make `data` and the close result type-checked instead of `any`.
    const dialogRef = this.dialog.open<
      CustomerFormDialog,
      CustomerFormDialogData,
      CustomerFormDialogResult
    >(CustomerFormDialog, { data: { customer }, width: '480px', maxWidth: '95vw' });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.kind === 'saved') {
        this.notify(customer ? 'Customer updated' : 'Customer added');
      } else if (result?.kind === 'not-found') {
        // The store has already reloaded the list, so the missing customer is gone from it.
        this.notify('This customer no longer exists');
      }
    });
  }

  protected confirmReset(): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Reset all customers?',
          message: 'This replaces every change with the original demo data.',
          confirmLabel: 'Reset',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.reset();
        }
      });
  }

  private async reset(): Promise<void> {
    try {
      await this.store.reset();
      this.notify('Demo data restored');
    } catch (error) {
      this.notify((error as ApiError).message);
    }
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: SNACKBAR_DURATION_MS });
  }
}

// localStorage can throw (e.g. blocked storage or private mode), and the saved value may be anything.
function readSavedView(): CustomerView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'cards' ? 'cards' : 'table';
  } catch {
    return 'table';
  }
}

function saveView(view: CustomerView): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Not saving is fine: the choice just won't survive a refresh.
  }
}
