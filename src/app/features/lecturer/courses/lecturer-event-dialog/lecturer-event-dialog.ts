import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LecturerEventResponse } from '../../../../core/models/lecturer-courses.models';

@Component({
  selector: 'app-lecturer-event-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  templateUrl: './lecturer-event-dialog.html',
  styleUrl: './lecturer-event-dialog.scss'
})
export class LecturerEventDetailsDialog {
  private readonly dialogRef = inject(MatDialogRef<LecturerEventDetailsDialog>);
  readonly data: LecturerEventResponse = inject(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
