import { Routes } from '@angular/router';
import {Login} from './features/login/login';
import {StudentPage} from './features/student-page/student-page';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'student',
    component: StudentPage
  }
];
