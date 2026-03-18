import {computed, inject, Injectable, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserRole} from '../models/user-role';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentUser = signal<string | null>(localStorage.getItem('currentUser'));

  userRole = computed<UserRole>(() => {
    const name = this.currentUser()?.toLowerCase();
    switch (name) {
      case 'admin': return UserRole.Admin;
      case 'lecturer': return UserRole.Lecturer;
      case 'student': return UserRole.Student;
      default: return UserRole.None;
    }
  });

  isLoggedIn = computed(() => this.currentUser() !== null);

  login(name: string): boolean {
    const normalizedName = name.toLowerCase().trim();

    const validUsers = ['admin', 'lecturer', 'student'];

    if (validUsers.includes(normalizedName)) {
      this.currentUser.set(normalizedName);

      localStorage.setItem('currentUser', normalizedName);

      const returnUrl = this.route.snapshot.queryParams['returnUrl'];

      if (returnUrl && returnUrl !== '/') {
        this.router.navigateByUrl(returnUrl);
      }
      else {
        //const role = this.userRole()?.toLowerCase();
        //this.router.navigate([`/${role}`]);
        this.router.navigate([`/${normalizedName}`]);
      }
      return true;
    }
    else {
      console.error('Ungültiger Benutzername!');
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!this.isLoggedIn()) return false;
    //TODO: Implement password change
    return true;
  }
}
