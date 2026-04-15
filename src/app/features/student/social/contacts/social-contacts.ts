import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SocialService, PublicProfileResponse } from '../social.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-social-contacts',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    FormsModule
],
  templateUrl: './social-contacts.html',
  styleUrl: '../social-subpage.scss'
})
export class SocialContacts implements OnInit {
  students = signal<PublicProfileResponse[]>([]);
  searchQuery = signal('');
  loading = signal(false);
  
  private searchSubject = new Subject<string>();

  constructor(private socialService: SocialService) {
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    this.performSearch('');
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  performSearch(query: string): void {
    this.socialService.searchFellowStudents(query).subscribe({
      next: (results) => {
        this.students.set(results);
      }
    });
  }

  splitTags(tags?: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
}

