import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SocialService, CommunityEventResponse, AttendeeInfo } from '../social.service';
import { SocialEventDialog } from './dialog/social-event-dialog';
import { AttendeesDialog } from './dialog/attendees-dialog';
import { ConfirmDialog } from './dialog/confirm-dialog';
import { UserService } from '../../../../core/user/user.service';

@Component({
  selector: 'app-social-events',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDialogModule, 
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './social-events.html',
  styleUrl: '../social-subpage.scss'
})
export class SocialEvents implements OnInit {
  private socialService = inject(SocialService);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);

  events = signal<CommunityEventResponse[]>([]);
  loading = signal(true);
  currentUserId = computed(() => {
    const profile = this.userService.profile();
    return profile ? Number(profile.id) : null;
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.socialService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SocialEventDialog, {
      width: '600px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEvents();
    });
  }

  editEvent(event: CommunityEventResponse): void {
    const dialogRef = this.dialog.open(SocialEventDialog, {
      width: '600px',
      maxWidth: '95vw',
      data: { event }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEvents();
    });
  }

  deleteEvent(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'social.events.deleteTitle',
        message: 'social.events.deleteConfirm',
        confirmText: 'common.delete',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.socialService.deleteEvent(id).subscribe(() => this.loadEvents());
      }
    });
  }

  isAttending(event: CommunityEventResponse): boolean {
    const id = this.currentUserId();
    return id !== null && event.attendees?.some(a => a.id === id);
  }

  toggleRsvp(event: CommunityEventResponse): void {
    const currentEvents = this.events();
    const userId = this.currentUserId();
    if (!userId) return;

    const userProfile = this.userService.profile();
    const attendee: AttendeeInfo = {
      id: userId,
      name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'You'
    };

    const isAttending = this.isAttending(event);
    
    // Optimistic Update
    const updatedEvents = currentEvents.map(e => {
      if (e.id === event.id) {
        const newAttendees = isAttending
          ? e.attendees.filter(a => a.id !== userId)
          : [...(e.attendees || []), attendee];
        return { ...e, attendees: newAttendees };
      }
      return e;
    });
    this.events.set(updatedEvents);

    // Background Request
    const request = isAttending
      ? this.socialService.cancelRsvp(event.id)
      : this.socialService.rsvpToEvent(event.id);

    request.subscribe({
      error: () => {
        // Rollback on error
        this.events.set(currentEvents);
      }
    });
  }

  viewAttendees(event: CommunityEventResponse): void {
    this.dialog.open(AttendeesDialog, {
      width: '400px',
      data: { event }
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'STUDY': 'primary',
      'SOCIAL': 'accent',
      'SPORTS': 'warn',
      'WORKSHOP': 'tertiary',
      'OTHER': 'secondary'
    };
    return colors[category] || 'primary';
  }
}
