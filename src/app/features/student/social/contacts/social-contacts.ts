import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-social-contacts',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './social-contacts.html',
  styleUrl: '../social-subpage.scss'
})
export class SocialContacts {}
