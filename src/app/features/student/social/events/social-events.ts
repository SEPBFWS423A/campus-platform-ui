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
import { SocialService, CommunityEventResponse } from '../social.service';
import { SocialEventDialog } from './dialog/social-event-dialog';
import { AttendeesDialog } from './dialog/attendees-dialog';
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
    if (confirm('Are you sure you want to delete this event?')) {
      this.socialService.deleteEvent(id).subscribe(() => this.loadEvents());
    }
  }

  isAttending(event: CommunityEventResponse): boolean {
    const id = this.currentUserId();
    return id !== null && event.attendees?.some(a => a.id === id);
  }

  toggleRsvp(event: CommunityEventResponse): void {
    if (this.isAttending(event)) {
      this.socialService.cancelRsvp(event.id).subscribe(() => this.loadEvents());
    } else {
      this.socialService.rsvpToEvent(event.id).subscribe(() => this.loadEvents());
    }
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
