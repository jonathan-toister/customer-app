import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { dialogHeadingId } from './dialog-shell';

let lastDialogNumber = 0;

/**
 * Opens every dialog in the app with the same settings. The look comes from DialogShell.
 * Built on the CDK Dialog, which has no styles of its own but handles the hard parts: it keeps keyboard
 * focus inside the dialog, closes on Escape or a backdrop click (unless `disableClose`), gives focus back to
 * the button that opened it, and sets `role="dialog"` and `aria-modal`.
 */
@Injectable({ providedIn: 'root' })
export class AppDialog {
  private readonly dialog = inject(Dialog);

  /** Type arguments: the component, its data, and what it closes with (like MatDialog). */
  open<DialogComponent, Data, Result>(
    component: ComponentType<DialogComponent>,
    data: Data,
    width = '400px',
  ): DialogRef<Result, DialogComponent> {
    // Our own id, so DialogShell can derive the heading id from it and the dialog is named by its heading.
    const id = `app-dialog-${++lastDialogNumber}`;
    return this.dialog.open<Result, Data, DialogComponent>(component, {
      id,
      data,
      width,
      maxWidth: '95vw',
      ariaLabelledBy: dialogHeadingId(id),
    });
  }
}
