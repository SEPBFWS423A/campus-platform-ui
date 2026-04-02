import { Routes } from '@angular/router';
import {Downloads} from './downloads/downloads';
import {InfoComponent} from './info/info';
import {ChangePassword} from './change-password/change-password';

export const commonRoutes: Routes = [
  {
    path: 'downloads',
    component: Downloads
  },
  {
    path: 'info',
    component: InfoComponent
  },
  {
    path: 'change-password',
    component: ChangePassword
  },
];
