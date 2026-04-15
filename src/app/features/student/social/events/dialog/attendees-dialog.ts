import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {CommunityEventResponse } from '../../social.service';

@Component({
  selector: 'app-social-attendees-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'social.events.rsvp.attendees' | translate }}</h2>
    <mat-dialog-content>
      <div class="attendee-list">
        <div class="attendee-item meta-host">
          <mat-icon>star</mat-icon>
          <div class="attendee-info">
            <span class="name">{{ data.event.creatorName }}</span>
            <span class="role">Host</span>
          </div>
        </div>

        @for (attendee of data.event.attendees; track attendee.id) {
          <div class="attendee-item">
            <mat-icon>person</mat-icon>
            <div class="attendee-info">
              <span class="name">{{ attendee.name }}</span>
            </div>
          </div>
        }

        @if (!data.event.attendees || data.event.attendees.length === 0) {
          <p class="no-attendees">{{ 'social.events.rsvp.noAttendees' | translate }}</p>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .attendee-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 250px;
    }

    .attendee-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--mat-sys-surface-container-lowest);
      border-radius: 0.5rem;
      border: 1px solid var(--mat-sys-outline-variant);

      &.meta-host {
        background: var(--mat-sys-primary-container);
        border-color: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary-container);
        
        mat-icon {
          color: var(--mat-sys-primary);
        }
      }

      mat-icon {
        color: var(--mat-sys-secondary);
      }

      .attendee-info {
        display: flex;
        flex-direction: column;

        .name {
          font-weight: 500;
        }

        .role {
          font-size: 0.75rem;
          opacity: 0.8;
        }
      }
    }

    .no-attendees {
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      padding: 1rem 0;
      font-style: italic;
    }
  `]
})
export class AttendeesDialog {
  constructor(
    public dialogRef: MatDialogRef<AttendeesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { event: CommunityEventResponse }
  ) {}
}
