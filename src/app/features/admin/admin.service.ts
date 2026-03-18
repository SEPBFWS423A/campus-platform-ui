import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../core/models/user-role';
import { Observable } from 'rxjs';

export interface InvitationPayload {
  email: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/admin';

  inviteUser(email: string, role: UserRole): Observable<void> {
    const payload: InvitationPayload = { email, role };
    return this.http.post<void>(`${this.apiUrl}/invite`, payload);
  }
}
