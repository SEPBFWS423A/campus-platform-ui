import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { UserRole } from '../models/user-role';
import {InstitutionInfo} from '../../features/admin/admin.service';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  theme: string;
  brightness: string;
  language: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/users';

  private _profile: WritableSignal<UserProfile | null> = signal(null);
  public readonly profile = this._profile.asReadonly();

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(profile => this._profile.set(profile))
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, { oldPassword, newPassword });
  }

  updatePreferences(theme: string, brightness: string, language: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/profile/preferences`, { theme, brightness, language }).pipe(
      tap(() => {
        const currentProfile = this._profile();
        if (currentProfile) {
          this._profile.set({
            ...currentProfile,
            theme,
            brightness,
            language
          });
        }
      })
    );
  }

  clearProfile() {
    this._profile.set(null);
  }

  getInstitutionInfo(): Observable<InstitutionInfo> {
    return this.http.get<InstitutionInfo>(`${this.apiUrl}/institution`);
  }
}
