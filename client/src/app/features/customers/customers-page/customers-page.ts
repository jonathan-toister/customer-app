import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { map } from 'rxjs';
import { CustomerCards } from '../components/customer-cards/customer-cards';
import { CustomerTable } from '../components/customer-table/customer-table';
import { CustomerToolbar, CustomerView } from '../components/customer-toolbar/customer-toolbar';
import { CustomerStore } from '../data/customer.store';

const VIEW_STORAGE_KEY = 'customers.view';

/** The customers screen: connects the store to the toolbar and the views. */
@Component({
  selector: 'app-customers-page',
  imports: [CustomerToolbar, CustomerTable, CustomerCards, MatButton],
  templateUrl: './customers-page.html',
  styleUrl: './customers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  protected readonly store = inject(CustomerStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

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

  protected onViewChange(view: CustomerView): void {
    this.selectedView.set(view);
    saveView(view);
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
