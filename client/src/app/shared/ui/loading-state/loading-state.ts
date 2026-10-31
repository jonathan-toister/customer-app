import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

/** Centred spinner with an optional label. */
@Component({
  selector: 'app-loading-state',
  imports: [MatProgressSpinner],
  templateUrl: './loading-state.html',
  styleUrl: './loading-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingState {
  readonly label = input('');
}
