import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SocialService, PublicProfileResponse } from './social.service';
import { ProfileEditDialog } from './profile/profile-edit-dialog';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    MatIconModule, 
    MatTabsModule, 
    RouterModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './social.html',
  styleUrl: './social.scss'
})
export class Social implements OnInit {
  navLinks = [
    { path: 'events', label: 'social.tabs.events', icon: 'event' },
    { path: 'contacts', label: 'social.tabs.contacts', icon: 'contact_page' }
  ];

  profile = signal<PublicProfileResponse | null>(null);
  loadingProfile = signal(true);

  constructor(
    private socialService: SocialService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    this.loadingProfile.set(true);
    this.socialService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loadingProfile.set(false);
      },
      error: () => this.loadingProfile.set(false)
    });
  }

  joinSocialHub(): void {
    this.socialService.joinSocialHub({ visibility: true }).subscribe(profile => {
      this.profile.set(profile);
    });
  }

  openEditDialog(): void {
    const currentProfile = this.profile();
    if (!currentProfile) return;

    const dialogRef = this.dialog.open(ProfileEditDialog, {
      width: '500px',
      data: { profile: currentProfile }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.socialService.updateMyProfile(result).subscribe(updated => {
          this.profile.set(updated);
        });
      }
    });
  }


  splitTags(tags?: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
}
