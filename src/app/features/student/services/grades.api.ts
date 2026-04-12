import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentGradeOverviewResponse } from '../../../core/models/grades.models';

@Injectable({
  providedIn: 'root',
})
export class GradesApiService {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<StudentGradeOverviewResponse> {
    return this.http.get<StudentGradeOverviewResponse>('/api/users/grades/overview');
  }
}
