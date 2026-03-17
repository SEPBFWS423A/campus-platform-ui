import { Routes } from '@angular/router';
import {Login} from './features/login/login';
import {MainLayout} from './shared/layouts/main-layout/main-layout';
import {authGuard} from './core/auth/auth-guard';
import {roleGuard} from './core/auth/role-guard';
import {UserRole} from './core/models/user-role';

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
