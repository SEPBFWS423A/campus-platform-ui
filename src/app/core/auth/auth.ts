import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../models/user-role';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

interface JwtPayload {
  id: number;
  sub: string; // Subject (email)
  role: UserRole;
  firstname: string;
  lastname: string;
  theme: string;
  brightness: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authApiUrl = environment.apiUrl + '/auth';

  token = signal<string | null>(localStorage.getItem('token'));

  currentUser = computed<User | null>(() => {
    const currentToken = this.token();
    if (!currentToken) return null;
    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1])) as JwtPayload;
      return {
        id: payload.id,
        email: payload.sub,
        firstname: payload.firstname,
        lastname: payload.lastname,
        role: payload.role,
        theme: payload.theme,
        brightness: payload.brightness,
        enabled: true,
      };
    } catch (e) {
      console.error('Failed to decode JWT token:', e);
      return null;
    }
  });

  isLoggedIn = computed(() => !!this.currentUser() && !!this.token());
  userRole = computed<UserRole | null>(() => this.currentUser()?.role || null);

  login(email: string, password?: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/login`, { email, password }).pipe(
      tap(({ token }) => {
        localStorage.setItem('token', token);
        this.token.set(token);

        try {
          const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
          if (payload && payload.role) {
            const rolePath = payload.role.toLowerCase();
            this.router.navigate([`/${rolePath}`]);
          } else {
            this.router.navigate(['/']);
          }
        } catch (e) {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  logout() {
    this.token.set(null);
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  completeRegistration(token: string, firstname: string, lastname: string, password?: string): Observable<void> {
    const payload = { token, firstname, lastname, password };
    return this.http.post<void>(`${this.authApiUrl}/complete-registration`, payload);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.authApiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.authApiUrl}/reset-password`, { newPassword }, { params: { token } });
  }
}
