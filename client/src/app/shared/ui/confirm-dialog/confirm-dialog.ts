import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { DialogShell } from '../dialog-shell/dialog-shell';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
}

/**
 * Generic yes/no dialog. Closes with `true` (confirm) or `false` (cancel). Backdrop or Escape
 * closes with `undefined`, so callers should check `=== true`.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButton, DialogShell],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<boolean, ConfirmDialog>>(DialogRef);
}
