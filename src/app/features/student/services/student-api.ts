import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StudentTodayEvent {
  eventId: number;
  eventName: string;
  eventType: 'LEHRVERANSTALTUNG' | 'KLAUSUR' | string;
  moduleName: string;
  roomName: string | null;       // null wenn kein Raum zugewiesen
  startTime: string;             // ISO-DateTime
  durationMinutes: number;
}

export interface StudentNotification {
  type: 'GRADE' | 'DEADLINE' | 'EXAM' | string;
  icon: string;                  // Material Symbol Name
  colorClass: 'success' | 'primary' | 'warning' | string;
  text: string;                  // HTML-Text (kann <strong> enthalten)
  detail: string | null;
}

export interface StudentDashboard {
  firstName: string;
  lastName: string;
  courseOfStudyName: string | null;
  averageGrade: number | null;   // null wenn noch keine Benotung
  ectsEarned: number | null;     // null wenn ECTS-Daten fehlen
  ectsTotal: number | null;      // null wenn Studiengang-ECTS nicht konfiguriert
  upcomingExamCount: number;
  todayEvents: StudentTodayEvent[];
  notifications: StudentNotification[];
}

@Injectable({ providedIn: 'root' })
export class StudentApi {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  getDashboard(): Observable<StudentDashboard> {
    return this.http.get<StudentDashboard>(`${this.apiUrl}/dashboard`);
  }
}
