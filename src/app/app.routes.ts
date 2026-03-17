import { Routes } from '@angular/router';
import {Login} from './features/login/login';
import {MainLayout} from './shared/layouts/main-layout/main-layout';
import {authGuard} from './core/auth/auth-guard';
import {roleGuard} from './core/auth/role-guard';
import {UserRole} from './core/models/user-role';
import {inject} from '@angular/core';
import {Auth} from './core/auth/auth';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const auth = inject(Auth);
          const user = auth.currentUser();
          return user ? `/${user}` : '/login';
        }
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { expectedRole: UserRole.Admin },
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
      },
      {
        path: 'common',
        loadChildren: () => import('./features/common/common.routes').then(m => m.commonRoutes)
      },
      {
        path: 'lecturer',
        canActivate: [roleGuard],
        data: { expectedRole: UserRole.Lecturer },
        loadChildren: () => import('./features/lecturer/lecturer.routes').then(m => m.lecturerRoutes)
      },
      {
        path: 'student',
        canActivate: [roleGuard],
        data: { expectedRole: UserRole.Student },
        loadChildren: () => import('./features/student/student.routes').then(m => m.studentRoutes)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
