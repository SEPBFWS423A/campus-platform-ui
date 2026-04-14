import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LecturerAbsenceResponse } from '../../lecturer/models/lecturer.models';

export interface AbsenceAuditLogEntry {
  id: number;
  absenceId: number;
  action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  performedBy: string;
  performedAt: string;
  previousStatus: string | null;
  newStatus: string;
  reason: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAbsenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/absences`;

  getAllAbsences(): Observable<LecturerAbsenceResponse[]> {
    return this.http.get<LecturerAbsenceResponse[]>(this.apiUrl);
  }

  deleteAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Sub-Issue #292: Abwesenheit genehmigen */
  approveAbsence(id: number): Observable<LecturerAbsenceResponse> {
    return this.http.patch<LecturerAbsenceResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  /** Sub-Issue #292: Abwesenheit ablehnen */
  rejectAbsence(id: number, reason: string): Observable<LecturerAbsenceResponse> {
    return this.http.patch<LecturerAbsenceResponse>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /** Sub-Issue #297: Audit-Trail laden */
  getHistory(id: number): Observable<AbsenceAuditLogEntry[]> {
    return this.http.get<AbsenceAuditLogEntry[]>(`${this.apiUrl}/${id}/history`);
  }
}
