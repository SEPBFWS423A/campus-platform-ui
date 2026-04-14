import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminUserStats {
  total: number;
  staff: number;
  students: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getUserStats(): Observable<AdminUserStats> {
    return this.http.get<AdminUserStats>(`${this.apiUrl}/users/stats`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }
}