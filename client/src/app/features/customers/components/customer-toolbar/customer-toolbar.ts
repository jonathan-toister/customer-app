import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { CustomerSort, SortField } from '../../data/customer.model';

export type CustomerView = 'table' | 'cards';

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created' },
];

/** Search, sort, view switch and actions. Presentational: inputs in, outputs out. */
@Component({
  selector: 'app-customer-toolbar',
  imports: [
    MatButton,
    MatIconButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatIcon,
    MatInput,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatProgressBar,
    MatSelect,
    MatOption,
    MatTooltip,
  ],
  templateUrl: './customer-toolbar.html',
  styleUrl: './customer-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerToolbar {
  readonly query = input.required<string>();
  readonly sort = input.required<CustomerSort>();
  readonly view = input.required<CustomerView>();
  readonly showViewSwitch = input(true);
  /** A request is running while results are already on screen. */
  readonly busy = input(false);

  readonly queryChange = output<string>();
  /** Separate from queryChange(''), so clearing can search at once instead of waiting for the debounce. */
  readonly clear = output<void>();
  readonly sortChange = output<CustomerSort>();
  readonly viewChange = output<CustomerView>();
  readonly add = output<void>();
  readonly reset = output<void>();

  protected readonly sortFields = SORT_FIELDS;

  protected readonly orderLabel = computed(() =>
    this.sort().order === 'asc'
      ? 'Sorted ascending, switch to descending'
      : 'Sorted descending, switch to ascending',
  );

  protected onSortFieldChange(field: SortField): void {
    this.sortChange.emit({ ...this.sort(), field });
  }

  protected toggleOrder(): void {
    const order = this.sort().order === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ ...this.sort(), order });
  }
}
