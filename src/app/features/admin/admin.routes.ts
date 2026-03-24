import { Routes } from '@angular/router';
import {AdminHome} from './admin-home/admin-home';
import {RoomManagement} from './room-management/room-management';
import {EventManagement} from './event-management/event-management';
import {UserManagement} from './user-management/user-management';
import {ExamManagement} from './exam-management/exam-management';
import {AcademicStructure} from './academic-structure/academic-structure';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminHome
  },
  {
    path: 'event-management',
    component: EventManagement
  },
  {
    path: 'room-management',
    component: RoomManagement
  },
  {
    path: 'user-management',
    component: UserManagement
  },
  {
    path: 'academic-structure',
    component: AcademicStructure
  },
  {
    path: 'exam-management',
    component: ExamManagement
  },
];
