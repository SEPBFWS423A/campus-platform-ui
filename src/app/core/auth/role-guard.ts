import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {Auth} from './auth';
import {UserRole} from '../models/user-role';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const userRole = auth.userRole();
  const expectedRole = route.data['expectedRole'] as UserRole;

  if (!auth.isLoggedIn() || userRole !== expectedRole) {
    return router.parseUrl('/unauthorized');
  }

  return true;
};
