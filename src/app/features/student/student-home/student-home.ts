import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StudentApi, StudentDashboard, StudentTodayEvent } from '../services/student-api';

type EventStatus = 'past' | 'current' | 'future';

interface TodayEventWithStatus extends StudentTodayEvent {
  status: EventStatus;
  endTime: Date;
}

@Component({
  selector: 'app-student-home',
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  templateUrl: './student-home.html',
  styleUrl: './student-home.scss',
})
export class StudentHome implements OnInit {
  private studentApi = inject(StudentApi);

  dashboard = signal<StudentDashboard | null>(null);
  loading = signal(true);
  error = signal(false);
  currentDate = new Date();

  // Heutigen Events Status-Annotation (past / current / future)
  todayEvents = computed<TodayEventWithStatus[]>(() => {
    const data = this.dashboard();
    if (!data) return [];
    const now = new Date();
    return data.todayEvents.map(e => {
      const start = new Date(e.startTime);
      const end   = new Date(start.getTime() + (e.durationMinutes ?? 0) * 60_000);
      let status: EventStatus = 'future';
      if (end < now)         status = 'past';
      else if (start <= now) status = 'current';
      return { ...e, status, endTime: end };
    });
  });

  // ECTS-Fortschrittsbalken (0–100)
  ectsProgress = computed(() => {
    const d = this.dashboard();
    if (!d || d.ectsEarned == null || d.ectsTotal == null || d.ectsTotal === 0) return 0;
    return Math.min(100, Math.round((d.ectsEarned / d.ectsTotal) * 100));
  });

  // Formatiert ECTS-Anzeige
  ectsLabel = computed(() => {
    const d = this.dashboard();
    if (!d) return '–';
    if (d.ectsEarned == null) return '–';
    return d.ectsTotal != null ? `${d.ectsEarned} / ${d.ectsTotal}` : `${d.ectsEarned}`;
  });

  ngOnInit(): void {
    this.studentApi.getDashboard().subscribe({
      next: data => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  // Uhrzeit aus ISO-String formatiert zurückgeben (HH:MM)
  formatTime(isoString: string): string {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // Schnellzugriff-Buttons (statisch, interne und externe Ziele)
  readonly quickActions = [
    { icon: 'upload_file', label: 'Abgaben',  route: '/student/submissions', external: false },
    { icon: 'email',       label: 'Kontakt',  route: null, external: true, href: 'mailto:sekr@university.edu' },
    { icon: 'local_library', label: 'Bib',   route: null, external: true, href: '#' },
    { icon: 'restaurant_menu', label: 'Mensa', route: null, external: true, href: '#' },
  ];
}
