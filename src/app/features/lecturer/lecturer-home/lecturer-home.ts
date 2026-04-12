import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lecturer-home',
  imports: [CommonModule],
  templateUrl: './lecturer-home.html',
  styleUrl: './lecturer-home.scss',
})
export class LecturerHome {
  today = new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  stats = [
    { label: 'Aktive Kurse', value: '2', sub: '6 Kurse gesamt', icon: '📚' },
    { label: 'Studierende', value: '2', sub: 'Eingeschriebene Studierende', icon: '👥' },
    { label: 'Anstehende Prüfungen', value: '2', sub: 'Nächste: 15.03.2026', icon: '📅' },
    { label: 'Notenschnitt', value: '1.2', sub: 'Über 4 bewertete Kurse', icon: '📊' },
  ];

  todayEvents = [
    { name: 'IT-Projektmanagement', time: '09:45 - 13:00', room: 'R 2.05' },
  ];

  activities = [
    { name: 'IT-Projektmanagement', type: 'Klausur (90 min)', date: '15.03.2026', room: 'Hörsaal 2', time: '09:00 - 10:30' },
    { name: 'IT-Recht & Compliance', type: 'Referat', date: '25.03.2026', room: 'Hörsaal 4', time: '10:00 - 11:30' },
    { name: '3 neue Abgaben in IT-Projektmanagement', type: '', date: 'Vor 2 Stunden', room: '', time: '' },
    { name: 'Notenvergabe für E-Business abgeschlossen', type: '', date: 'Gestern, 16:45', room: '', time: '' },
  ];

  quickLinks = [
    { label: 'Meine Kurse', icon: '📖' },
    { label: 'Notenvergabe', icon: '📝' },
    { label: 'Downloads', icon: '📁' },
    { label: 'Uni-Info', icon: 'ℹ️' },
  ];
}