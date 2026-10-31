import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

/** The id of a dialog's heading. AppDialog passes it as `ariaLabelledBy`, so the heading names the dialog. */
export function dialogHeadingId(dialogId: string): string {
  return `${dialogId}-heading`;
}

/**
 * The look of every dialog: heading, content, and a row of actions at the bottom.
 * Put the buttons in `<ng-container dialog-actions>`. Only works inside a dialog opened by AppDialog.
 */
@Component({
  selector: 'app-dialog-shell',
  templateUrl: './dialog-shell.html',
  styleUrl: './dialog-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShell {
  readonly heading = input.required<string>();

  protected readonly headingId = dialogHeadingId(inject(DialogRef).id);
}
