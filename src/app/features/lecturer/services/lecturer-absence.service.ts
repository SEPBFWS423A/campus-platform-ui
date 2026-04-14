import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LecturerAbsenceRequest,
  LecturerAbsenceResponse,
  ConflictingEventDto
} from '../models/lecturer.models';

@Injectable({ providedIn: 'root' })
export class LecturerAbsenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lecturer/absences`;

  getMyAbsences(): Observable<LecturerAbsenceResponse[]> {
    return this.http.get<LecturerAbsenceResponse[]>(this.apiUrl);
  }

  /**
   * Prüft im Voraus ob ein Zeitraum Konflikte mit Lehrveranstaltungen erzeugt.
   * start/end im Format "yyyy-MM-ddTHH:mm:ss" (ISO LocalDateTime).
   */
  checkConflicts(start: string, end: string): Observable<ConflictingEventDto[]> {
    return this.http.get<ConflictingEventDto[]>(`${this.apiUrl}/conflicts`, {
      params: { start, end }
    });
  }

  /**
   * Legt eine neue Abwesenheit an.
   * Mit force=true wird der Konfliktcheck im Backend übersprungen.
   */
  createAbsence(req: LecturerAbsenceRequest, force = false): Observable<LecturerAbsenceResponse> {
    return this.http.post<LecturerAbsenceResponse>(this.apiUrl, req, {
      params: force ? { force: 'true' } : {}
    });
  }

  deleteAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
