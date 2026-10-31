import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/** "Nothing here" message with an optional action button (shown only when `actionLabel` is set). */
@Component({
  selector: 'app-empty-state',
  imports: [MatButton, MatIcon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  /** A Material Symbols icon name, e.g. `search_off`. */
  readonly icon = input.required<string>();
  readonly heading = input.required<string>();
  readonly message = input('');
  readonly actionLabel = input('');

  readonly action = output<void>();
}
