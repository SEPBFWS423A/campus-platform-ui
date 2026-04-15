import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobPosting, JobStatus, JobPostingRequest } from '../job-postings/job-postings';

@Injectable({ providedIn: 'root' })
export class JobPostingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/job-postings`;

  getAll(status?: JobStatus): Observable<JobPosting[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<JobPosting[]>(this.base, { params });
  }

  getById(id: number): Observable<JobPosting> {
    return this.http.get<JobPosting>(`${this.base}/${id}`);
  }

  create(req: JobPostingRequest): Observable<JobPosting> {
    return this.http.post<JobPosting>(this.base, req);
  }

  update(id: number, req: JobPostingRequest): Observable<JobPosting> {
    return this.http.put<JobPosting>(`${this.base}/${id}`, req);
  }

  setStatus(id: number, status: JobStatus): Observable<JobPosting> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<JobPosting>(`${this.base}/${id}/status`, null, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
