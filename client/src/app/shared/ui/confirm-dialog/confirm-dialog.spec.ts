import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

const DATA: ConfirmDialogData = {
  title: 'Reset all customers?',
  message: 'This replaces every change with the original demo data.',
  confirmLabel: 'Reset',
};

describe('ConfirmDialog', () => {
  function setup() {
    const dialogRef = { id: 'test-dialog', close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: DIALOG_DATA, useValue: DATA },
        { provide: DialogRef, useValue: dialogRef },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const button = (label: string) =>
      [...element.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;
    return { dialogRef, element, button };
  }

  it('shows the title, message and confirm label it was given', () => {
    const { element, button } = setup();

    expect(element.querySelector('h2')?.textContent).toContain(DATA.title);
    expect(element.textContent).toContain(DATA.message);
    expect(button('Reset')).toBeTruthy();
  });

  it('closes with true when confirmed', () => {
    const { dialogRef, button } = setup();

    button('Reset').click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('closes with false when cancelled', () => {
    const { dialogRef, button } = setup();

    button('Cancel').click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
