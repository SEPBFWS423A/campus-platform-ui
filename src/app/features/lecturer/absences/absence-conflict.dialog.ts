import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ConflictingEventDto } from '../models/lecturer.models';

export interface AbsenceConflictDialogData {
  conflictingEvents: ConflictingEventDto[];
  /** Wenn true: Nur Anzeige (Vorab-Check), kein Force-Submit-Button */
  readOnly?: boolean;
}

@Component({
  selector: 'app-absence-conflict-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title class="conflict-title">
      <mat-icon class="conflict-icon">event_busy</mat-icon>
      Terminkonflikt festgestellt
    </h2>

    <mat-dialog-content class="conflict-content">
      <p class="conflict-intro">
        Im gewählten Zeitraum sind <strong>{{ data.conflictingEvents.length }}</strong>
        {{ data.conflictingEvents.length === 1 ? 'Lehrveranstaltung' : 'Lehrveranstaltungen' }} geplant:
      </p>

      <ul class="conflict-list">
        @for (event of data.conflictingEvents; track event.eventId) {
          <li class="conflict-item">
            <mat-icon class="item-icon">schedule</mat-icon>
            <div class="item-details">
              <span class="item-name">{{ event.eventName }}</span>
              <span class="item-time">
                {{ event.startTime | date:'dd.MM.yyyy, HH:mm' }}
                &ndash;
                {{ event.endTime | date:'HH:mm' }} Uhr
              </span>
            </div>
          </li>
        }
      </ul>

      @if (!data.readOnly) {
        <p class="conflict-warning">
          <mat-icon class="warning-icon">warning</mat-icon>
          Sie können die Abwesenheit trotzdem eintragen. Die betroffenen Veranstaltungen
          werden nicht automatisch abgesagt.
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Abbrechen</button>
      @if (!data.readOnly) {
        <button mat-flat-button color="warn" [mat-dialog-close]="true">
          <mat-icon>warning</mat-icon>
          Trotzdem anlegen
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .conflict-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
    }
    .conflict-icon {
      color: var(--mat-sys-error);
    }
    .conflict-content {
      min-width: 360px;
      max-width: 520px;
    }
    .conflict-intro {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }
    .conflict-list {
      list-style: none;
      padding: 0;
      margin: 0 0 16px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background-color: var(--mat-sys-error-container);
    }
    .item-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 2px;
      color: var(--mat-sys-on-error-container);
      flex-shrink: 0;
    }
    .item-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--mat-sys-on-error-container);
    }
    .item-time {
      font-size: 12px;
      color: var(--mat-sys-on-error-container);
      opacity: 0.8;
    }
    .conflict-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      background-color: var(--mat-sys-tertiary-container, #f5e6c8);
      font-size: 13px;
      color: var(--mat-sys-on-tertiary-container, #4a3800);
      margin: 0;
    }
    .warning-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 1px;
      flex-shrink: 0;
      color: var(--mat-sys-on-tertiary-container, #4a3800);
    }
  `]
})
export class AbsenceConflictDialog {
  readonly dialogRef = inject(MatDialogRef<AbsenceConflictDialog>);
  readonly data = inject<AbsenceConflictDialogData>(MAT_DIALOG_DATA);
}
