import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudentGradeOverviewResponse, GradeScaleEntryResponse } from '../models/grades.models';

@Injectable({
  providedIn: 'root'
})
export class GradesService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getOverview(): Observable<StudentGradeOverviewResponse> {
    return this.http.get<StudentGradeOverviewResponse>(`${this.apiUrl}/users/grades/overview`);
  }

  getGradeScale(): Observable<GradeScaleEntryResponse[]> {
    return this.http.get<GradeScaleEntryResponse[]>(`${this.apiUrl}/users/grade-scale`);
  }
}
