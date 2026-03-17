import { Routes } from '@angular/router';
import {StudentHome} from './student-home/student-home';
import {Grades} from './grades/grades';
import {Submissions} from './submissions/submissions';
import {Timetable} from './timetable/timetable';

export const studentRoutes: Routes = [
  {
    path: '',
    component: StudentHome
  },
  {
    path: 'grades',
    component: Grades
  },
  {
    path: 'submissions',
    component: Submissions
  },
  {
    path: 'timetable',
    component: Timetable
  },
];
