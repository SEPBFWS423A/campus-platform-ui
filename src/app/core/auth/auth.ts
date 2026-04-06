import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../models/user-role';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {catchError, Observable, switchMap, tap} from 'rxjs';
import {UserProfile, UserService} from '../user/user.service';

interface LoginResponse {
  token: string;
}

interface JwtPayload {
  id: number;
  sub: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private authApiUrl = environment.apiUrl + '/auth';

  token = signal<string | null>(localStorage.getItem('token'));

  isLoggedIn = computed(() => !!this.token());

  userRole = computed<UserRole | null>(() => {
    const currentToken = this.token();
    if (!currentToken) return null;
    try {
      const payload = JSON.parse(atob(currentToken.split('.')[1])) as JwtPayload;
      return payload.role;
    } catch (e) {
      console.error('Failed to decode JWT token:', e);
      return null;
    }
  });

  constructor() {
    if (this.token()) {
      this.userService.getProfile().subscribe({
        error: () => this.logout()
      });
    }
  }

  login(email: string, password?: string, returnUrl?: string | null): Observable<UserProfile> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/login`, { email, password }).pipe(
      tap(({ token }) => {
        localStorage.setItem('token', token);
        this.token.set(token);
      }),
      switchMap(() => this.userService.getProfile()),
      tap((user) => {
        if (user && user.role) {
          if (returnUrl && returnUrl !== '/' && this.canAccess(user.role, returnUrl)) {
            this.router.navigateByUrl(returnUrl);
          } else {
            const rolePath = user.role.toLowerCase();
            this.router.navigate([`/${rolePath}`]);
          }
        } else {
          this.router.navigate(['/']);
        }
      }),
      catchError((error) => {
        this.router.navigate(['/login']);
        throw error;
      })
    );
  }

  logout() {
    this.token.set(null);
    this.userService.clearProfile();
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  completeRegistration(token: string, salutation: string, title: string, firstName: string, lastName: string, password?: string): Observable<void> {
    const payload = { token, salutation, title, firstName, lastName, password };
    return this.http.post<void>(`${this.authApiUrl}/complete-registration`, payload);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.authApiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.authApiUrl}/reset-password`, { newPassword }, { params: { token } });
  }

  private canAccess(role: UserRole, url: string): boolean {
    const rolePath = role.toLowerCase();
    return url.startsWith(`/${rolePath}`);
  }
}
