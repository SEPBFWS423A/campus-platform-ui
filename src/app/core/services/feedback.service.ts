import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeedbackRequest {
  content: string;
  lecturerId: number;
}

export interface FeedbackResponse {
  id: number;
  content: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly baseUrl = `${environment.apiUrl}/feedback`;
  private http = inject(HttpClient);

  submitFeedback(request: FeedbackRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request);
  }

  getMyFeedback(): Observable<FeedbackResponse[]> {
    return this.http.get<FeedbackResponse[]>(`${this.baseUrl}/my`);
  }
}
