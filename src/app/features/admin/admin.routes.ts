import { Routes } from '@angular/router';
import {AdminHome} from './admin-home/admin-home';
import {RoomManagement} from './room-management/room-management';
import {EventManagement} from './event-management/event-management';
import {UserManagement} from './user-management/user-management';
import {ExamManagement} from './exam-management/exam-management';
import {AcademicStructure} from './academic-structure/academic-structure';
import {CourseSeriesDetails} from './event-management/course-series-details/course-series-details';
import { AdminApplications } from './applications/applications';
import {LecturerAbsencesAdmin} from './lecturer-absences/lecturer-absences';

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
    path: 'event-management/:id',
    component: CourseSeriesDetails
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
  {
  path: 'applications',
  component: AdminApplications
  },
    path: 'lecturer-absences',
    component: LecturerAbsencesAdmin
  },
];
