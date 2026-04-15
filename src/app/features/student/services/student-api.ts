import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CourseDocumentRequest, CourseDocumentResponse, LecturerCourseResponse } from '../../lecturer/models/lecturer.models';

@Injectable({
  providedIn: 'root',
})
export class StudentApi {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private http = inject(HttpClient);

  getCourses(): Observable<LecturerCourseResponse[]> {
    return this.http.get<LecturerCourseResponse[]>(`${this.baseUrl}/courses`);
  }

  getCourseDocuments(seriesId: number): Observable<CourseDocumentResponse[]> {
    return this.http.get<CourseDocumentResponse[]>(`${this.baseUrl}/course-series/${seriesId}/documents`);
  }

  uploadCourseDocument(seriesId: number, request: CourseDocumentRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/course-series/${seriesId}/documents`, request);
  }

  deleteCourseDocument(seriesId: number, documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/course-series/${seriesId}/documents/${documentId}`);
  }

  downloadCourseDocument(seriesId: number, documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/course-series/${seriesId}/documents/${documentId}/download`, { responseType: 'blob' });
  }
}
