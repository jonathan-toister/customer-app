import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/** Full-area error with a "Try again" button. For when there's nothing else to show. */
@Component({
  selector: 'app-error-state',
  imports: [MatButton, MatIcon],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorState {
  readonly heading = input('Something went wrong');
  readonly message = input.required<string>();

  readonly retry = output<void>();
}
