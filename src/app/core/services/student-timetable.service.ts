import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StudentActiveCourseResponse, StudentEventResponse } from '../models/student-timetable.models';

@Injectable({
  providedIn: 'root',
})
export class StudentTimetableService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/student/timetable`;

  getUpcomingEvents(): Observable<StudentEventResponse[]> {
    return this.http.get<StudentEventResponse[]>(`${this.apiUrl}/events`);
  }

  getActiveCourses(): Observable<StudentActiveCourseResponse[]> {
    return this.http.get<StudentActiveCourseResponse[]>(`${this.apiUrl}/active-series`);
  }
}
