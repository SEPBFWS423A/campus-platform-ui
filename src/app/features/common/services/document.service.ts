import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GeneralDocument, UploadGeneralDocumentRequest } from '../../../core/models/general-document';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;
  private adminApiUrl = `${environment.apiUrl}/admin/documents`;

  constructor(private http: HttpClient) { }

  // --- Public/User Endpoints ---
  getDocuments(): Observable<GeneralDocument[]> {
    return this.http.get<GeneralDocument[]>(this.apiUrl);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  // --- General Endpoints ---
  adminGetDocuments(category?: string): Observable<GeneralDocument[]> {
    const params: any = {};
    if (category) params.category = category;
    return this.http.get<GeneralDocument[]>(this.apiUrl, { params });
  }

  uploadDocument(request: UploadGeneralDocumentRequest): Observable<GeneralDocument> {
    return this.http.post<GeneralDocument>(this.apiUrl, request);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
