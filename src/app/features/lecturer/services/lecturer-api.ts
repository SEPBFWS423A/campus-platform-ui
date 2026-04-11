import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LecturerCourseResponse,
  StudentSubmissionResponse,
  ExamMaterialsRequest,
  GradeBulkRequest,
  SingleGradeRequest,
  ExamDocumentResponse,
  SubmissionDocumentDownloadData
} from '../models/lecturer.models';

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LecturerApi {
  private readonly baseUrl = `${environment.apiUrl}/lecturer`;

  constructor(private http: HttpClient) {}

  getCourses(): Observable<LecturerCourseResponse[]> {
    return this.http.get<LecturerCourseResponse[]>(`${this.baseUrl}/courses`);
  }

  uploadExamMaterials(seriesId: number, request: ExamMaterialsRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/course-series/${seriesId}/exam-materials`, request);
  }

  getSubmissions(seriesId: number): Observable<StudentSubmissionResponse[]> {
    console.log(`[LecturerApi] GET Submissions for ${seriesId}: ${this.baseUrl}/course-series/${seriesId}/submissions`);
    return this.http.get<StudentSubmissionResponse[]>(`${this.baseUrl}/course-series/${seriesId}/submissions`);
  }

  bulkApplyGrades(seriesId: number, request: GradeBulkRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/course-series/${seriesId}/grades`, request);
  }

  updateSingleGrade(seriesId: number, data: SingleGradeRequest): Observable<StudentSubmissionResponse> {
    return this.http.put<StudentSubmissionResponse>(`${this.baseUrl}/course-series/${seriesId}/single-grade`, data);
  }

  publishGrades(seriesId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/course-series/${seriesId}/publish`, {});
  }

  downloadDocument(seriesId: number, type: string): Observable<ExamDocumentResponse> {
    return this.http.get<ExamDocumentResponse>(`${this.baseUrl}/course-series/${seriesId}/download-document?type=${type}`);
  }

  downloadStudentSubmission(seriesId: number, studentId: number): Observable<SubmissionDocumentDownloadData> {
    return this.http.get<SubmissionDocumentDownloadData>(`${this.baseUrl}/course-series/${seriesId}/student-submissions/${studentId}/download`);
  }
}
