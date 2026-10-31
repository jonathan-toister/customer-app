import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CustomerStatus } from '../../data/customer.model';

/** The status word in a coloured badge. Used by the table and the cards, so both always look the same. */
@Component({
  selector: 'app-customer-status-badge',
  templateUrl: './customer-status-badge.html',
  styleUrl: './customer-status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerStatusBadge {
  readonly status = input.required<CustomerStatus>();
}
