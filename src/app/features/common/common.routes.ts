import { Routes } from '@angular/router';
import {Downloads} from './downloads/downloads';
import {Info} from './info/info';
import {ChangePassword} from './change-password/change-password';

export const commonRoutes: Routes = [
  {
    path: 'downloads',
    component: Downloads
  },
  {
    path: 'info',
    component: Info
  },
  {
    path: 'change-password',
    component: ChangePassword
  },
];
