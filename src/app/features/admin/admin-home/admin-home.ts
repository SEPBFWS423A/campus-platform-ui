import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApi, AdminUserStats } from '../services/admin-api';

@Component({
  selector: 'app-admin-home',
  imports: [CommonModule],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
})
export class AdminHome implements OnInit {
  private adminApi = inject(AdminApi);

  today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  loading = signal(true);
  error = signal(false);

  // Normales Array statt Signal – kompatibel mit *ngFor
  stats = [
    { label: 'Benutzer gesamt', value: '…', sub: '…', icon: '👥' },
    { label: 'Räume', value: '9', sub: '7 belegt • 2 frei', icon: '🏛️' },
    { label: 'Veranstaltungsreihen', value: '5', sub: '11 Events insgesamt', icon: '📅' },
    { label: 'Prüfungsergebnisse', value: '5', sub: '2 Prüfungen bewertet', icon: '📊' },
  ];

  activities = [
    { name: 'IT-Projektmanagement', type: 'Klausur', date: '15.03.2026', room: 'Hörsaal 2' },
    { name: 'Künstliche Intelligenz', type: 'Klausur', date: '18.03.2026', room: 'Audimax' },
    { name: 'ERP-Systeme (SAP)', type: 'Klausur', date: '22.03.2026', room: 'PC-Labor 1' },
    { name: 'IT-Recht & Compliance', type: 'Klausur', date: '25.03.2026', room: 'Hörsaal 4' },
    { name: '5 Prüfungsergebnisse eingetragen', type: '', date: 'Heute', room: '' },
  ];

  quickLinks = [
    { label: 'Benutzerverwaltung', icon: '👥' },
    { label: 'Raumverwaltung', icon: '🏛️' },
    { label: 'Veranstaltungen', icon: '📅' },
    { label: 'Prüfungsamt', icon: '📝' },
  ];

  ngOnInit(): void {
    this.adminApi.getUserStats().subscribe({
      next: (data) => {
        this.stats[0] = {
          label: 'Benutzer gesamt',
          value: String(data.total),
          sub: `${data.students} Stud. • ${data.staff} Mitarb.`,
          icon: '👥',
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}