import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Customer, CustomerSort, SortField } from '../../data/customer.model';
import { CustomerStatusBadge } from '../customer-status-badge/customer-status-badge';

/**
 * Customers as a table. The headers show and change the sort, but the rows are never sorted here:
 * the server sorts, and the store passes the sorted list back in through `customers`.
 */
@Component({
  selector: 'app-customer-table',
  imports: [
    DatePipe,
    MatIconButton,
    MatIcon,
    MatSort,
    MatSortHeader,
    MatTableModule,
    CustomerStatusBadge,
  ],
  templateUrl: './customer-table.html',
  styleUrl: './customer-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerTable {
  readonly customers = input.required<Customer[]>();
  readonly sort = input.required<CustomerSort>();

  readonly edit = output<Customer>();
  readonly sortChange = output<CustomerSort>();

  protected readonly columns = ['name', 'email', 'status', 'createdAt', 'actions'];

  protected onSortChange(sort: Sort): void {
    // matSortDisableClear means the direction is always 'asc' or 'desc', never ''.
    this.sortChange.emit({
      field: sort.active as SortField,
      order: sort.direction === 'asc' ? 'asc' : 'desc',
    });
  }
}
