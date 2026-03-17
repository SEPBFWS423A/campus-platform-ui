import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {Auth} from './auth';
import {UserRole} from '../models/user-role';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const userRole = auth.userRole();
  const expectedRole = route.data['expectedRole'] as UserRole;

  if (!expectedRole) {
    console.error(`Konfigurationsfehler: Die Route ${state.url} hat kein expectedRole!`);
    return false;
  }

  if (userRole === expectedRole) {
    return true;
  }

  return router.parseUrl('/login');
};
