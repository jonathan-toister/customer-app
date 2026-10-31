import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { Customer } from '../../data/customer.model';
import { CustomerStatusBadge } from '../customer-status-badge/customer-status-badge';

/** Customers as a grid of cards. Sorting is done in the toolbar, since cards have no headers. */
@Component({
  selector: 'app-customer-cards',
  imports: [
    DatePipe,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    CustomerStatusBadge,
  ],
  templateUrl: './customer-cards.html',
  styleUrl: './customer-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCards {
  readonly customers = input.required<Customer[]>();

  readonly edit = output<Customer>();
}
