import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface AdminApplication {
  id: number;
  studentName: string;
  studentEmail: string;
  programName: string;
  status: string;
  priority: number;
  motivation: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-applications',
  imports: [CommonModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
})
export class AdminApplications {
  applications = signal<AdminApplication[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<AdminApplication[]>('/api/admin/applications').subscribe({
      next: (data) => {
        this.applications.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Bewerbungen konnten nicht geladen werden.');
        this.loading.set(false);
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.http.patch<AdminApplication>(`/api/admin/applications/${id}/status?status=${status}`, {}).subscribe({
      next: (updated) => {
        this.applications.update(apps =>
          apps.map(a => a.id === id ? updated : a)
        );
      },
      error: () => this.error.set('Status konnte nicht aktualisiert werden.')
    });
  }

  accept(id: number) { this.updateStatus(id, 'ACCEPTED'); }
  reject(id: number) { this.updateStatus(id, 'REJECTED'); }

  pending = computed(() => this.applications().filter(a => a.status === 'PENDING').length);
  accepted = computed(() => this.applications().filter(a => a.status === 'ACCEPTED').length);
  rejected = computed(() => this.applications().filter(a => a.status === 'REJECTED').length);
}