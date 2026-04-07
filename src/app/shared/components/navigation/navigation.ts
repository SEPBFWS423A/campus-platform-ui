import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Auth } from '../../../core/auth/auth';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../../core/models/user-role';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UserSettingsDialog } from '../settings/user-settings.dialog/user-settings.dialog';
import { InstitutionInfo } from '../../../features/admin/admin.service';
import {UserService} from '../../../core/user/user.service';

export type NavLink = {
  path: string;
  label: string;
  icon: string;
  activeIcon?: string;
  exact: boolean;
};

const COMMON_LINKS: NavLink[] = [
  { path: '/common/downloads', label: 'navigation.common.downloads', icon: 'folder', exact: false },
  { path: '/common/info', label: 'navigation.common.infoCenter', icon: 'info', exact: false }
];

const NAVIGATION_CONFIG: Record<string, NavLink[]> = {
  [UserRole.Admin]: [
    { path: '/admin', label: 'navigation.admin.home', icon: 'home', exact: true },
    { path: '/admin/user-management', label: 'navigation.admin.userManagement', icon: 'manage_accounts', exact: false },
    { path: '/admin/academic-structure', label: 'navigation.admin.academicStructure', icon: 'school', exact: false },
    { path: '/admin/room-management', label: 'navigation.admin.roomManagement', icon: 'room_preferences', exact: false },
    { path: '/admin/event-management', label: 'navigation.admin.eventManagement', icon: 'event', exact: false },
    { path: '/admin/exam-management', label: 'navigation.admin.examManagement', icon: 'insert_chart', exact: false }
  ],
  [UserRole.Lecturer]: [
    { path: '/lecturer', label: 'navigation.lecturer.home', icon: 'home', exact: true },
    { path: '/lecturer/courses', label: 'navigation.lecturer.myCourses', icon: 'library_books', exact: false },
    { path: '/lecturer/grading', label: 'navigation.lecturer.grading', icon: 'assessment', exact: false },
    { path: '/lecturer/submissions-overview', label: 'navigation.lecturer.submissionsOverview', icon: 'assignment', exact: false }
  ],
  [UserRole.Student]: [
    { path: '/student', label: 'navigation.student.home', icon: 'home', exact: true },
    { path: '/student/timetable', label: 'navigation.student.timetable', icon: 'calendar_month', exact: false },
    { path: '/student/grades', label: 'navigation.student.grades', icon: 'star_outline', activeIcon: 'star', exact: false },
    { path: '/student/submissions', label: 'navigation.student.submissions', icon: 'task', exact: false }
  ]
}

@Component({
  selector: 'app-navigation',
  imports: [
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    MatButton
  ],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation implements OnInit {
  public auth = inject(Auth);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  hoveredItem = signal<string | null>(null);
  universityName = signal<string>('');

  ngOnInit() {
    this.userService.getInstitutionInfo().subscribe((info: InstitutionInfo) => {
      this.universityName.set(info.universityName);
    });
  }

  currentLinks = computed(() => {
    const role = this.auth.userRole();
    if (!role) return [];

    const roleSpecific = NAVIGATION_CONFIG[role] || [];

    return [...roleSpecific, ...COMMON_LINKS];
  });

  openSettings() {
    this.dialog.open(UserSettingsDialog, { width: '400px' });
  }
}
