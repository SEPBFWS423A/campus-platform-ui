import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'holiday' | 'closed';
}

@Component({
  selector: 'app-holidays',
  imports: [CommonModule, FormsModule],
  templateUrl: './holidays.html',
  styleUrl: './holidays.scss',
})
export class Holidays {
  showForm = false;
  holidays = signal<Holiday[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  newHoliday = { name: '', startDate: '', endDate: '', type: 'holiday' as 'holiday' | 'closed' };

  constructor(private http: HttpClient) {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<Holiday[]>('/api/admin/holidays').subscribe({
      next: (data) => {
        this.holidays.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Fehler beim Laden der Einträge.');
        this.loading.set(false);
      }
    });
  }

  add(): void {
    if (!this.newHoliday.name || !this.newHoliday.startDate || !this.newHoliday.endDate) return;
    this.http.post<Holiday>('/api/admin/holidays', this.newHoliday).subscribe({
      next: (created) => {
        this.holidays.update(list => [...list, created]);
        this.newHoliday = { name: '', startDate: '', endDate: '', type: 'holiday' };
        this.showForm = false;
      },
      error: () => this.error.set('Fehler beim Hinzufügen.')
    });
  }

  delete(id: number): void {
    this.http.delete(`/api/admin/holidays/${id}`).subscribe({
      next: () => this.holidays.update(list => list.filter(h => h.id !== id)),
      error: () => this.error.set('Fehler beim Löschen.')
    });
  }
}