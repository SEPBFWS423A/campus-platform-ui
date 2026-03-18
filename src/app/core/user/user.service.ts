import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/user';

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { oldPassword, newPassword });
  }

  updateThemeSettings(theme: string, brightness: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile/preferences`, { theme, brightness });
  }
}
