import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LecturerActiveCourseResponse, LecturerEventResponse, StudentAttendeeResponse } from '../models/lecturer-courses.models';

@Injectable({
  providedIn: 'root',
})
export class LecturerCoursesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lecturer`;

  getTimetableEvents(): Observable<LecturerEventResponse[]> {
    return this.http.get<LecturerEventResponse[]>(`${this.apiUrl}/timetable/events`);
  }

  getActiveCourses(): Observable<LecturerActiveCourseResponse[]> {
    return this.http.get<LecturerActiveCourseResponse[]>(`${this.apiUrl}/timetable/active-series`);
  }

  getSeriesAttendees(seriesId: number): Observable<StudentAttendeeResponse[]> {
    return this.http.get<StudentAttendeeResponse[]>(`${this.apiUrl}/course-series/${seriesId}/submissions`);
  }
}
