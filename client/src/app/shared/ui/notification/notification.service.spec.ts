import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(): NotificationService {
    return TestBed.inject(NotificationService);
  }

  it('shows a success message by default', () => {
    const notifications = setup();

    notifications.show('Customer added');

    expect(notifications.current()).toEqual({ message: 'Customer added', kind: 'success' });
  });

  it('hides the message by itself after 4 seconds', () => {
    const notifications = setup();

    notifications.show('Customer added');
    vi.advanceTimersByTime(3999);
    expect(notifications.current()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(notifications.current()).toBeNull();
  });

  it('replaces the current message and gives the new one its full 4 seconds', () => {
    const notifications = setup();

    notifications.show('Customer added');
    vi.advanceTimersByTime(3000);
    notifications.show('Reset failed', 'error');
    vi.advanceTimersByTime(3000);

    expect(notifications.current()).toEqual({ message: 'Reset failed', kind: 'error' });
    vi.advanceTimersByTime(1000);
    expect(notifications.current()).toBeNull();
  });

  it('hides the message at once on dismiss()', () => {
    const notifications = setup();

    notifications.show('Customer added');
    notifications.dismiss();

    expect(notifications.current()).toBeNull();
  });
});
