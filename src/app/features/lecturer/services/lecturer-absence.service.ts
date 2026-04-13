import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LecturerAbsenceRequest, LecturerAbsenceResponse } from '../models/lecturer.models';

@Injectable({ providedIn: 'root' })
export class LecturerAbsenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lecturer/absences`;

  getMyAbsences(): Observable<LecturerAbsenceResponse[]> {
    return this.http.get<LecturerAbsenceResponse[]>(this.apiUrl);
  }

  createAbsence(req: LecturerAbsenceRequest): Observable<LecturerAbsenceResponse> {
    return this.http.post<LecturerAbsenceResponse>(this.apiUrl, req);
  }

  deleteAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
