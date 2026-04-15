import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BlockoutConflictResult } from '../../admin.service';

@Component({
  selector: 'app-blockout-conflict-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="conflict-title">
      <mat-icon color="warn">report_problem</mat-icon>
      Belegungskonflikte festgestellt
    </h2>
    <mat-dialog-content>
      <p>Die geplante Sperrung überschneidet sich mit bestehenden Einträgen:</p>
      
      @if (data.affectedEvents.length > 0) {
        <div class="conflict-section">
          <h3>Betroffene Veranstaltungen ({{ data.affectedEvents.length }})</h3>
          <ul class="conflict-list">
            @for (event of data.affectedEvents; track event.eventId) {
              <li>
                <strong>{{ event.eventName }}</strong><br>
                <small>{{ event.startTime | date:'short' }}</small>
              </li>
            }
          </ul>
        </div>
      }

      @if (data.overlappingBlockouts.length > 0) {
        <div class="conflict-section">
          <h3>Andere Sperrungen ({{ data.overlappingBlockouts.length }})</h3>
          <ul class="conflict-list">
            @for (b of data.overlappingBlockouts; track b.id) {
              <li>
                <strong>{{ b.reason | titlecase }}</strong> ({{ b.priority }})<br>
                <small>{{ b.startTime | date:'short' }} bis {{ b.endTime | date:'short' }}</small>
              </li>
            }
          </ul>
        </div>
      }

      <p class="warning-note">Möchten Sie den Raum trotzdem sperren? Bestehende Veranstaltungen werden dadurch nicht automatisch abgesagt.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Abbrechen</button>
      <button mat-flat-button color="warn" (click)="onConfirm()">Trotzdem sperren</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .conflict-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .conflict-section { margin-bottom: 20px; }
    h3 { font-size: 14px; margin-bottom: 8px; color: var(--mat-sys-on-surface-variant); }
    .conflict-list { padding-left: 20px; font-size: 13px; max-height: 200px; overflow-y: auto; }
    .warning-note { font-size: 13px; border-left: 4px solid var(--mat-sys-error); padding-left: 12px; margin-top: 16px; opacity: 0.8; }
  `]
})
export class BlockoutConflictDialog {
  private dialogRef = inject(MatDialogRef<BlockoutConflictDialog>);
  data = inject<BlockoutConflictResult>(MAT_DIALOG_DATA);

  onConfirm() { this.dialogRef.close(true); }
  onCancel() { this.dialogRef.close(false); }
}
