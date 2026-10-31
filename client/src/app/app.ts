import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './shared/ui/notification/notification.service';
import { Toast } from './shared/ui/notification/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbar, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly notifications = inject(NotificationService);
}
