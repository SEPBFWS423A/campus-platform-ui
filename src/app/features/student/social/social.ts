import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, MatTabsModule, RouterModule],
  templateUrl: './social.html',
  styleUrl: './social.scss'
})
export class Social {
  navLinks = [
    { path: 'events', label: 'social.tabs.events', icon: 'event' },
    { path: 'contacts', label: 'social.tabs.contacts', icon: 'contact_page' }
  ];
}
