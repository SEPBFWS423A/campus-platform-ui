import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly baseUrl = '/api/users/submissions';

  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    console.log('SubmissionsService Token vorhanden:', !!token);
    console.log('SubmissionsService Base URL:', this.baseUrl);

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getSubmissions(): Observable<StudentSubmissionListItemResponse[]> {
    console.log('Service: getSubmissions wird ausgeführt');
    return this.http.get<StudentSubmissionListItemResponse[]>(this.baseUrl, {
      headers: this.createAuthHeaders(),
    });
  }

  getSubmissionDetail(submissionId: number): Observable<StudentSubmissionDetailResponse> {
    console.log('Service: getSubmissionDetail wird ausgeführt für ID:', submissionId);
    return this.http.get<StudentSubmissionDetailResponse>(`${this.baseUrl}/${submissionId}`, {
      headers: this.createAuthHeaders(),
    });
  }

  uploadDocument(
    submissionId: number,
    payload: UploadSubmissionDocumentRequest
  ): Observable<SubmissionDocumentResponse> {
    console.log('Service: uploadDocument wird ausgeführt für ID:', submissionId);
    return this.http.post<SubmissionDocumentResponse>(
      `${this.baseUrl}/${submissionId}/documents`,
      payload,
      {
        headers: this.createAuthHeaders(),
      }
    );
  }

  deleteDocument(submissionId: number, documentId: number): Observable<void> {
    console.log('Service: deleteDocument wird ausgeführt für Submission:', submissionId, 'Dokument:', documentId);
    return this.http.delete<void>(
      `${this.baseUrl}/${submissionId}/documents/${documentId}`,
      {
        headers: this.createAuthHeaders(),
      }
    );
  }

  downloadDocument(submissionId: number, documentId: number): Observable<Blob> {
    console.log('Service: downloadDocument wird ausgeführt für Submission:', submissionId, 'Dokument:', documentId);
    return this.http.get(`${this.baseUrl}/${submissionId}/documents/${documentId}/download`, {
      headers: this.createAuthHeaders(),
      responseType: 'blob',
    });
  }

  submitSubmission(submissionId: number): Observable<void> {
    console.log('Service: submitSubmission wird ausgeführt für ID:', submissionId);
    return this.http.post<void>(`${this.baseUrl}/${submissionId}/submit`, {}, {
      headers: this.createAuthHeaders(),
    });
  }
}
