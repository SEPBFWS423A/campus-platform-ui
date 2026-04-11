import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StudentSubmissionDetailResponse,
  StudentSubmissionListItemResponse,
  SubmissionDocumentResponse,
  UploadSubmissionDocumentRequest,
} from '../models/submissions.models';

@Injectable({
  providedIn: 'root',
})
export class SubmissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSubmissions(): Observable<StudentSubmissionListItemResponse[]> {
    return this.http.get<StudentSubmissionListItemResponse[]>(
      `${this.apiUrl}/users/submissions`
    );
  }

  getSubmissionDetail(submissionId: number): Observable<StudentSubmissionDetailResponse> {
    return this.http.get<StudentSubmissionDetailResponse>(
      `${this.apiUrl}/users/submissions/${submissionId}`
    );
  }

  uploadDocument(
    submissionId: number,
    payload: UploadSubmissionDocumentRequest
  ): Observable<SubmissionDocumentResponse> {
    return this.http.post<SubmissionDocumentResponse>(
      `${this.apiUrl}/users/submissions/${submissionId}/documents`,
      payload
    );
  }

  deleteDocument(submissionId: number, documentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/users/submissions/${submissionId}/documents/${documentId}`
    );
  }

  downloadDocument(submissionId: number, documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/users/submissions/${submissionId}/documents/${documentId}/download`,
      {
        responseType: 'blob',
      }
    );
  }

  submitSubmission(submissionId: number): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/users/submissions/${submissionId}/submit`,
      {}
    );
  }
}
