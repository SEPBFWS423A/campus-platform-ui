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

  /**
   * Calls the backend to change the password for the currently authenticated user.
   */
  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { oldPassword, newPassword });
  }

  /**
   * Calls the backend to update the theme settings for the currently authenticated user.
   */
  updateThemeSettings(theme: string, brightness: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile/preferences`, { theme, brightness });
  }
}
