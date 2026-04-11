import { Routes } from '@angular/router';
import {LecturerHome} from './lecturer-home/lecturer-home';
import {Courses} from './courses/courses';
import {Grading} from './grading/grading';

export const lecturerRoutes: Routes = [
  {
    path: '',
    component: LecturerHome
  },
  {
    path: 'courses',
    component: Courses
  },
  {
    path: 'grading',
    component: Grading
  }
];
