import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LecturerApi } from '../services/lecturer-api';
import { LecturerCourseResponse, ExamStatus } from '../models/lecturer.models';

@Component({
  selector: 'app-lecturer-home',
  imports: [CommonModule],
  templateUrl: './lecturer-home.html',
  styleUrl: './lecturer-home.scss',
})
export class LecturerHome implements OnInit {
  private lecturerApi = inject(LecturerApi);

  today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  loading = false;
  error = false;

  stats = [
    { label: 'Aktive Kurse', value: '…', sub: '…', icon: '📚' },
    { label: 'Studierende', value: '…', sub: 'Eingeschriebene Studierende', icon: '👥' },
    { label: 'Anstehende Prüfungen', value: '…', sub: '…', icon: '📅' },
    { label: 'Notenschnitt', value: '1.2', sub: 'Über 4 bewertete Kurse', icon: '📊' },
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

  ngOnInit(): void {
    this.loading = true;
    this.lecturerApi.getCourses().subscribe({
      next: (courses: LecturerCourseResponse[]) => {
        const aktiveKurse = courses.length;
        const gesamtStudierende = courses.reduce((sum, c) => sum + c.submissionCount, 0);
        const anstehendePruefungen = courses.filter(c =>
          c.examStatus === ExamStatus.OPEN || c.examStatus === ExamStatus.PROVIDED
        ).length;

        this.stats[0] = { label: 'Aktive Kurse', value: String(aktiveKurse), sub: `${aktiveKurse} Kurse gesamt`, icon: '📚' };
        this.stats[1] = { label: 'Studierende', value: String(gesamtStudierende), sub: 'Eingeschriebene Studierende', icon: '👥' };
        this.stats[2] = { label: 'Anstehende Prüfungen', value: String(anstehendePruefungen), sub: anstehendePruefungen > 0 ? 'Prüfungen offen' : 'Keine anstehend', icon: '📅' };

        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }
}