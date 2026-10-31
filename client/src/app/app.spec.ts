import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NotificationService } from './shared/ui/notification/notification.service';

describe('App', () => {
  it('shows notifications in the toast at the bottom of every page', () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    const notifications = TestBed.inject(NotificationService);

    notifications.show('Customer added');
    fixture.detectChanges();

    const toast: HTMLElement = fixture.nativeElement.querySelector('app-toast');
    expect(toast.textContent).toContain('Customer added');
    expect(toast.getAttribute('role')).toBe('status');
    notifications.dismiss();
  });
});
