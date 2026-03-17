import { Routes } from '@angular/router';
import {Downloads} from './downloads/downloads';
import {Info} from './info/info';

export const commonRoutes: Routes = [
  {
    path: 'downloads',
    component: Downloads
  },
  {
    path: 'info',
    component: Info
  },
];
