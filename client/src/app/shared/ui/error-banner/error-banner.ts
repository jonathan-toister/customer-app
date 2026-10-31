import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

/**
 * A red inline error box. Buttons placed inside the tag (e.g. "Try again") are shown after the message.
 * Used by the list's error banner and the form dialog's general error, so both look the same.
 */
@Component({
  selector: 'app-error-banner',
  imports: [MatIcon],
  templateUrl: './error-banner.html',
  styleUrl: './error-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert' },
})
export class ErrorBanner {
  readonly message = input.required<string>();
}
