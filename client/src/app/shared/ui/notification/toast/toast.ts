import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AppNotification } from '../notification.service';

/**
 * Shows one notification at the bottom of the screen. The element is always in the page, even with nothing
 * to show, because screen readers only announce live-region changes, not a region inserted with its text.
 */
@Component({
  selector: 'app-toast',
  imports: [MatIconButton, MatIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class Toast {
  readonly notification = input.required<AppNotification | null>();

  readonly dismiss = output<void>();
}
