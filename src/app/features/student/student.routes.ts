import { Routes } from '@angular/router';
import { StudentHome } from './student-home/student-home';
import { Grades } from './grades/grades';
import { Submissions } from './submissions/submissions';
import { Timetable } from './timetable/timetable';
import { StudentApplications } from './applications/applications';
import { Social } from './social/social';

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
  {
  path: 'applications',
  component: StudentApplications
},
  {
    path: 'social',
    component: Social,
    children: [
      { path: '', redirectTo: 'events', pathMatch: 'full' },
      { path: 'events', loadComponent: () => import('./social/events/social-events').then(m => m.SocialEvents) },
      { path: 'contacts', loadComponent: () => import('./social/contacts/social-contacts').then(m => m.SocialContacts) }
    ]
  }
];
