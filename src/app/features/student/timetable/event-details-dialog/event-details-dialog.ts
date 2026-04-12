import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { StudentEventResponse } from '../../../../core/models/student-timetable.models';

@Component({
  selector: 'app-event-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslateModule],
  templateUrl: './event-details-dialog.html',
  styleUrl: './event-details-dialog.scss'
})
export class EventDetailsDialog {
  private readonly dialogRef = inject(MatDialogRef<EventDetailsDialog>);
  readonly data: StudentEventResponse = inject(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
