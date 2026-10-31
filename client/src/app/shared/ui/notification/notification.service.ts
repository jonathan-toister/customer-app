import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error';

export interface AppNotification {
  message: string;
  kind: NotificationKind;
}

const AUTO_DISMISS_MS = 4000;

/**
 * The short message at the bottom of the screen ("Customer added"). One at a time: a new message replaces
 * the current one. App renders it with the Toast component, so every notification looks the same.
 * It only shows what callers pass in; it doesn't catch or handle errors itself.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly state = signal<AppNotification | null>(null);
  private dismissTimer: ReturnType<typeof setTimeout> | undefined;

  readonly current = this.state.asReadonly();

  show(message: string, kind: NotificationKind = 'success'): void {
    // Restart the timer, so a replacement message also gets its full time on screen.
    clearTimeout(this.dismissTimer);
    this.state.set({ message, kind });
    this.dismissTimer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
  }

  dismiss(): void {
    clearTimeout(this.dismissTimer);
    this.state.set(null);
  }
}
