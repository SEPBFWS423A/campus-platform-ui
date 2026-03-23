import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { startWith, map } from 'rxjs/operators';
import { AdminService, User, StudyGroup, UserRole, UserStatus, InvitationPayload, CourseOfStudy, Focus } from '../admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslateModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatSidenavModule,
    MatListModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTabsModule,
    MatButtonToggleModule,
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
})
export class UserManagement implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // --- Real Data ---
  private usersData = signal<User[]>([]);
  private groupsData = signal<StudyGroup[]>([]);
  private coursesData = signal<CourseOfStudy[]>([]);
  private focusesData = signal<Focus[]>([]);

  // View state
  activeView = signal<'directory' | 'groups' | 'onboarding' | 'academic'>('directory');
  selectedUser = signal<User | null>(null);
  selectedGroup = signal<StudyGroup | null>(null);
  selectedAcademicCourse = signal<CourseOfStudy | null>(null);
  isDrawerOpen = signal(false);
  isEditingUser = signal(false);

  // Onboarding Selection State
  onboardingMode = signal<'individual' | 'bulk' | 'csv'>('individual');

  // Creation State
  showAddGroupForm = signal(false);
  showAddCourseForm = signal(false);
  showAddFocusForm = signal(false);
  
  // Forms
  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [UserRole.Student, Validators.required],
    studentNumber: [''],
    courseOfStudy: [''],
    focus: ['']
  });

  bulkInviteForm = this.fb.group({
    emails: ['', Validators.required],
    role: [UserRole.Student, Validators.required],
    defaultCourse: [''],
    defaultFocus: ['']
  });

  groupForm = this.fb.group({
    name: ['', Validators.required],
    focus: ['', Validators.required],
    courseOfStudy: ['', Validators.required]
  });

  userEditForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    status: ['', Validators.required],
    studentNumber: [''],
    courseOfStudy: [''],
    focus: [''],
    startYear: ['']
  });

  courseForm = this.fb.group({
    name: ['', Validators.required]
  });

  get courseNameControl() { return this.courseForm.get('name') as FormControl; }

  focusForm = this.fb.group({
    name: ['', Validators.required],
    courseId: ['', Validators.required]
  });

  get focusNameControl() { return this.focusForm.get('name') as FormControl; }

  // Signals
  allUsers = this.usersData.asReadonly();
  allGroups = this.groupsData.asReadonly();
  allCoursesData = this.coursesData.asReadonly();
  allFocusesData = this.focusesData.asReadonly();

  // Filter signals
  searchFilter = signal('');
  roleFilter = signal<UserRole | ''>('');
  courseFilter = signal<string | ''>('');
  yearFilter = signal<number | ''>('');
  focusFilter = signal<string | ''>('');

  // Auto-complete
  addMemberControl = new FormControl('');
  filteredStudentsAutoComplete = signal<User[]>([]);

  // CSV parsing
  csvFileName = signal<string | null>(null);
  csvInvitations = signal<InvitationPayload[]>([]);

  // Derived signals
  filteredUsers = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const role = this.roleFilter();
    const course = this.courseFilter();
    const year = this.yearFilter();
    const focus = this.focusFilter();

    return this.allUsers().filter(u => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const matchesSearch = !search || (
        fullName.includes(search) ||
        (u.email || '').toLowerCase().includes(search) ||
        (u.studentNumber || '').toLowerCase().includes(search) ||
        (u.courseOfStudy || '').toLowerCase().includes(search)
      );

      return matchesSearch && (!role || u.role === role) && (!course || u.courseOfStudy === course) && (!year || u.startYear === year) && (!focus || u.focus === focus);
    });
  });

  filteredGroupsList = computed(() => {
    const search = this.searchFilter().toLowerCase();
    const course = this.courseFilter();
    return this.allGroups().filter(g => (!search || g.name.toLowerCase().includes(search)) && (!course || g.courseOfStudy === course));
  });

  currentGroupMembers = computed(() => {
    const group = this.selectedGroup();
    if (!group) return [];
    return this.allUsers().filter(u => group.memberIds.includes(u.id));
  });

  roles = Object.values(UserRole);
  statuses = Object.values(UserStatus);
  selectableStatuses = computed(() => this.statuses.filter(s => s !== UserStatus.Pending));
  courses = computed(() => Array.from(new Set(this.allUsers().map(u => u.courseOfStudy).filter(Boolean))));
  years = computed(() => Array.from(new Set(this.allUsers().map(u => u.startYear).filter(Boolean))).sort());
  focuses = computed(() => Array.from(new Set(this.allUsers().map(u => u.focus).filter(Boolean))));

  ngOnInit() {
    this.loadAllData();
    this.setupAutocomplete();
  }

  loadAllData() {
    this.useMockData(); // Force mock data for immediate UI review
    
    // Attempting to Load Real Data, fallback to UI Simulation if needed
    this.adminService.getUsers().subscribe({
      next: (users) => this.usersData.set(users),
      error: () => console.log('Mock data active (API error)')
    });
    this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
    this.adminService.getCourses().subscribe(courses => this.coursesData.set(courses));
    this.adminService.getFocuses().subscribe(focuses => this.focusesData.set(focuses));
  }

  // --- UI MOCK DATA (DELETE LATER) ---
  private useMockData() {
    this.usersData.set([
      { id: '1', firstName: 'Julia', lastName: 'Schmidt', email: 'j.schmidt@campus.de', role: UserRole.Student, status: UserStatus.Active, studentNumber: '702155', courseOfStudy: 'Computer Science', focus: 'AI & Data Science', startYear: 2023 },
      { id: '2', firstName: 'Marc', lastName: 'Weber', email: 'm.weber@faculty.de', role: UserRole.Lecturer, status: UserStatus.Active },
      { id: '3', firstName: 'Lukas', lastName: 'Müller', email: 'l.mueller@campus.de', role: UserRole.Student, status: UserStatus.Pending, studentNumber: '702160', courseOfStudy: 'Business Informatics', startYear: 2024 },
      { id: '4', firstName: 'Sarah', lastName: 'König', email: 's.koenig@admin.de', role: UserRole.Admin, status: UserStatus.Active }
    ]);
    this.groupsData.set([
      { id: 'g1', name: 'AI Study Lab', courseOfStudy: 'Computer Science', focus: 'AI & Data Science', memberCount: 1, memberIds: ['1'] },
      { id: 'g2', name: 'Business Strategy Group', courseOfStudy: 'Business Informatics', focus: 'Management', memberCount: 0, memberIds: [] }
    ]);
    this.coursesData.set([
       { id: 'c1', name: 'Computer Science' },
       { id: 'c2', name: 'Business Informatics' }
    ]);
    this.focusesData.set([
       { id: 'f1', name: 'AI & Data Science', courseId: 'c1' },
       { id: 'f2', name: 'Software Architecture', courseId: 'c1' },
       { id: 'f3', name: 'Digital Transformation', courseId: 'c2' },
       { id: 'f4', name: 'Management', courseId: 'c2' }
    ]);
  }

  setupAutocomplete() {
    this.addMemberControl.valueChanges.pipe(
      startWith(''),
      map(val => {
        const str = (typeof val === 'string' ? val : '').toLowerCase();
        const g = this.selectedGroup();
        if (!g) return [];
        return this.allUsers().filter(u => u.role === UserRole.Student && !g.memberIds.includes(u.id) && (u.firstName.toLowerCase().includes(str) || u.lastName.toLowerCase().includes(str) || u.studentNumber?.includes(str)));
      })
    ).subscribe(students => this.filteredStudentsAutoComplete.set(students as User[]));
  }

  switchView(view: 'directory' | 'groups' | 'onboarding' | 'academic') {
    this.activeView.set(view);
    this.selectedGroup.set(null);
    this.selectedAcademicCourse.set(null);
    this.isDrawerOpen.set(false);
  }

  selectUser(user: User) { this.selectedUser.set(user); this.isDrawerOpen.set(true); this.isEditingUser.set(false); }
  startEditing() { if (this.selectedUser()) { this.userEditForm.patchValue(this.selectedUser()!); this.isEditingUser.set(true); } }
  saveUserEdit() {
    const user = this.selectedUser();
    if (user && this.userEditForm.valid) {
      this.adminService.updateUser(user.id, this.userEditForm.value).subscribe(updatedUser => {
        this.usersData.update(users => users.map(u => u.id === user.id ? updatedUser : u));
        this.selectedUser.set(updatedUser);
        this.isEditingUser.set(false);
        this.notificationService.showSuccess('User updated successfully');
      });
    }
  }

  selectGroup(group: StudyGroup) { this.selectedGroup.set(group); }

  // --- ACADEMIC CRUD ---
  addCourse() {
    if (this.courseForm.invalid) return;
    this.adminService.createCourse(this.courseForm.value as any).subscribe(c => {
      this.coursesData.update(list => [...list, c]);
      this.courseForm.reset();
      this.showAddCourseForm.set(false);
      this.notificationService.showSuccess('Course of Study created');
    });
  }

  deleteCourse(id: string) {
    this.adminService.deleteCourse(id).subscribe(() => {
      this.coursesData.update(list => list.filter(c => c.id !== id));
      this.focusesData.update(list => list.filter(f => f.courseId !== id));
      this.notificationService.showSuccess('Course removed');
    });
  }

  addFocus() {
    if (this.focusForm.invalid) return;
    this.adminService.createFocus(this.focusForm.value as any).subscribe(f => {
      this.focusesData.update(list => [...list, f]);
      this.focusForm.reset({ courseId: f.courseId });
      this.showAddFocusForm.set(false);
      this.notificationService.showSuccess('Focus Area added');
    });
  }

  deleteFocus(id: string) {
    this.adminService.deleteFocus(id).subscribe(() => {
      this.focusesData.update(list => list.filter(f => f.id !== id));
      this.notificationService.showSuccess('Focus removed');
    });
  }

  getFocusesForCourse(courseId: string) {
    return this.allFocusesData().filter(f => f.courseId === courseId);
  }

  // Common Actions
  sendInvitation() {
    if (this.inviteForm.invalid) return;
    const invData = this.inviteForm.value as InvitationPayload;
    this.adminService.inviteUser(invData).subscribe(() => {
        this.notificationService.showSuccess('Invitation sent successfully');
        this.inviteForm.reset({ role: invData.role });
    });
  }

  sendBulkInvitations() {
    if (this.bulkInviteForm.invalid) return;
    const { emails, role } = this.bulkInviteForm.value;
    if (emails && role) {
      const lines = emails.split('\n').filter(Boolean);
      const invitations = lines.map(line => ({ email: line.trim(), role: role as UserRole }));
      this.adminService.bulkInvite(invitations).subscribe(() => {
          this.notificationService.showSuccess('Bulk invitations sent');
          this.bulkInviteForm.reset({ role: UserRole.Student });
      });
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.csvFileName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(Boolean);
        const invs = lines.map(l => ({ email: l.trim(), role: UserRole.Student }));
        this.csvInvitations.set(invs);
      };
      reader.readAsText(file);
    }
  }

  sendCsvInvitations() {
    if (this.csvInvitations().length > 0) {
      this.adminService.bulkInvite(this.csvInvitations()).subscribe(() => {
        this.notificationService.showSuccess('CSV Import successful');
        this.csvInvitations.set([]);
        this.csvFileName.set(null);
      });
    }
  }

  addGroup() {
    if (this.groupForm.invalid) return;
    this.adminService.createGroup(this.groupForm.value as any).subscribe(newGroup => {
      this.groupsData.update(g => [...g, newGroup]);
      this.showAddGroupForm.set(false);
      this.groupForm.reset();
      this.notificationService.showSuccess('Study Group created');
    });
  }

  removeUserFromGroup(userId: string, groupId: string) {
    this.adminService.removeGroupMember(groupId, userId).subscribe(() => {
      this.groupsData.update(gs => gs.map(g => g.id === groupId ? { ...g, memberIds: g.memberIds.filter(id => id !== userId), memberCount: g.memberCount - 1 } : g));
      if (this.selectedGroup()?.id === groupId) {
        this.selectedGroup.update(g => g ? { ...g, memberIds: g.memberIds.filter(id => id !== userId), memberCount: g.memberCount - 1 } : null);
      }
    });
  }

  addMember(student: User) {
    const g = this.selectedGroup();
    if (!g) return;
    this.adminService.addGroupMember(g.id, student.id).subscribe(() => {
      this.groupsData.update(gs => gs.map(group => group.id === g.id ? { ...group, memberIds: [...group.memberIds, student.id], memberCount: group.memberCount + 1 } : group));
      this.selectedGroup.update(group => group ? { ...group, memberIds: [...group.memberIds, student.id], memberCount: group.memberCount + 1 } : null);
      this.addMemberControl.setValue('');
    });
  }

  deleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { data: { title: 'Delete User', message: `Are you sure you want to delete ${user.firstName}?` } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(user.id).subscribe(() => {
          this.usersData.update(u => u.filter(usr => usr.id !== user.id));
          this.notificationService.showSuccess('User deleted');
          if (this.selectedUser()?.id === user.id) this.closeUserDrawer();
        });
      }
    });
  }

  closeUserDrawer() { this.isDrawerOpen.set(false); this.selectedUser.set(null); }
  cancelEditing() { this.isEditingUser.set(false); }
  updateSearch(event: Event) { this.searchFilter.set((event.target as HTMLInputElement).value); }
  getUserGroups(userId: string) { return this.allGroups().filter(g => g.memberIds.includes(userId)); }
  getStatusColor(status: UserStatus) { return status === UserStatus.Active ? 'primary' : status === UserStatus.Pending ? 'accent' : 'warn'; }
  getRoleColor(role: UserRole) { return role === UserRole.Admin ? 'accent' : role === UserRole.Lecturer ? 'primary' : ''; }
}
