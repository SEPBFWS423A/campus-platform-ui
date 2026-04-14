import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../../core/models/user-role';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { UserSettingsDialog } from '../settings/user-settings.dialog/user-settings.dialog';
import { InstitutionInfo } from '../../../features/admin/admin.service';
import { UserService } from '../../../core/user/user.service';
import { PublicService } from '../../../core/public/public.service';

export type NavLink = {
  path: string;
  label: string;
  icon: string;
  activeIcon?: string;
  exact: boolean;
  secondary?: boolean;
};

const COMMON_LINKS: NavLink[] = [
  { path: '/common/downloads', label: 'navigation.common.downloads', icon: 'folder', exact: false, secondary: true },
  { path: '/common/info', label: 'navigation.common.infoCenter', icon: 'info', exact: false, secondary: true }
];

const NAVIGATION_CONFIG: Record<string, NavLink[]> = {
  [UserRole.Admin]: [
    { path: '/admin', label: 'navigation.admin.home', icon: 'home', exact: true },
    { path: '/admin/user-management', label: 'navigation.admin.userManagement', icon: 'manage_accounts', exact: false },
    { path: '/admin/academic-structure', label: 'navigation.admin.academicStructure', icon: 'school', exact: false },
    { path: '/admin/room-management', label: 'navigation.admin.roomManagement', icon: 'room_preferences', exact: false },
    { path: '/admin/event-management', label: 'navigation.admin.eventManagement', icon: 'event', exact: false },
    { path: '/admin/exam-management', label: 'navigation.admin.examManagement', icon: 'insert_chart', exact: false },
    { path: '/admin/lecturer-absences', label: 'nav.lecturerAbsences', icon: 'event_busy', exact: false }
  ],
  [UserRole.Lecturer]: [
    { path: '/lecturer', label: 'navigation.lecturer.home', icon: 'home', exact: true },
    { path: '/lecturer/courses', label: 'navigation.lecturer.myCourses', icon: 'library_books', exact: false },
    { path: '/lecturer/grading', label: 'navigation.lecturer.grading', icon: 'assessment', exact: false },
    { path: '/lecturer/absences', label: 'nav.absences', icon: 'event_busy', exact: false }
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
    MatButton,
    MatIconButton,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class Navigation implements OnInit {
  public auth = inject(Auth);
  private dialog = inject(MatDialog);
  public publicService = inject(PublicService);
  private breakpointObserver = inject(BreakpointObserver);

  hoveredItem = signal<string | null>(null);

  isCollapsed = toSignal(
    this.breakpointObserver.observe('(max-width: 1600px)').pipe(map(result => result.matches)),
    { initialValue: false }
  );

  ngOnInit() {
  }

  homePath = computed(() => {
    const role = this.auth.userRole();
    if (!role) return '/';
    return `/${role.toLowerCase()}`;
  });

  primaryLinks = computed(() => {
    return this.allLinks().filter(link => !link.secondary);
  });

  secondaryLinks = computed(() => {
    return this.allLinks().filter(link => !!link.secondary);
  });

  private allLinks = computed(() => {
    const role = this.auth.userRole();
    if (!role) return [];

    const roleSpecific = NAVIGATION_CONFIG[role] || [];

    return [...roleSpecific, ...COMMON_LINKS];
  });

  openSettings() {
    this.dialog.open(UserSettingsDialog, { width: '400px' });
  }
}
