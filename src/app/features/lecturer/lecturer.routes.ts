import { Routes } from '@angular/router';
import {LecturerHome} from './lecturer-home/lecturer-home';
import {Courses} from './courses/courses';
import {Grading} from './grading/grading';
import {SubmissionsOverview} from './submissions-overview/submissions-overview';

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
  },
  {
    path: 'submissions-overview',
    component: SubmissionsOverview
  },
];
