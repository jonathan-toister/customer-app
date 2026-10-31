import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CustomerStore } from '../data/customer.store';

// TEMPORARY (phase 2): a debug dump to verify the store. Replaced by the real page in phase 3.
@Component({
  selector: 'app-customers-page',
  imports: [JsonPipe],
  template: `
    <input
      #search
      aria-label="Search customers"
      placeholder="Search…"
      [value]="store.query()"
      (input)="store.setQuery(search.value)"
    />
    <pre>{{ debug() | json }}</pre>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPage {
  protected readonly store = inject(CustomerStore);

  protected readonly debug = computed(() => ({
    loading: this.store.loading(),
    error: this.store.error(),
    query: this.store.query(),
    sort: this.store.sort(),
    count: this.store.customers().length,
    names: this.store.customers().map((customer) => customer.name),
  }));
}
