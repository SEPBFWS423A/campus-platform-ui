import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LecturerAbsenceResponse } from '../../lecturer/models/lecturer.models';

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
}
