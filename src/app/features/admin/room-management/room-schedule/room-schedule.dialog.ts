import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Room } from '../../admin.service';
import { RoomSchedule } from './room-schedule';

@Component({
  selector: 'app-room-schedule-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, RoomSchedule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Belegungsplan: {{ data.room.name }}</h2>
      <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="dialog-content">
      <app-room-schedule 
        [rooms]="[data.room]" 
        [selectedRoomId]="data.room.id" 
        [mode]="'detail'" />
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
      
      h2 { margin: 0; }
    }
    .dialog-content {
      min-width: 900px;
      max-width: 95vw;
      min-height: 600px;
    }
  `]
})
export class RoomScheduleDialog {
  dialogRef = inject(MatDialogRef<RoomScheduleDialog>);
  data = inject<{ room: Room }>(MAT_DIALOG_DATA);
}
