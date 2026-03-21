import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../core/models/user-role';
import { Observable } from 'rxjs';

export interface InvitationPayload {
  email: string;
  role: UserRole;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
}

export interface UserStats {
  total: number;
  staff: number;
  students: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private adminApiUrl = environment.apiUrl + '/admin';

  inviteUser(email: string, role: UserRole): Observable<void> {
    const payload: InvitationPayload = { email, role };
    return this.http.post<void>(`${this.adminApiUrl}/invite`, payload);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.adminApiUrl}/users`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.adminApiUrl}/users/stats`);
  }

  updateUser(id: number, user: { firstname: string, lastname: string, email: string, role: UserRole }): Observable<User> {
    return this.http.put<User>(`${this.adminApiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/users/${id}`);
  }
}
