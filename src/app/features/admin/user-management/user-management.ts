import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { startWith, map, finalize } from 'rxjs/operators';
import { AdminService, User, StudyGroup, InvitationPayload, CourseOfStudy, Specialization, DegreeType, InstitutionInfo, GroupMember } from '../admin.service';
import { UserRole } from '../../../core/models/user-role';
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
  private specializationsData = signal<Specialization[]>([]);

  // View state
  activeView = signal<'directory' | 'groups' | 'onboarding'>('directory');
  selectedUser = signal<User | null>(null);
  selectedGroup = signal<StudyGroup | null>(null);
  isDrawerOpen = signal(false);
  isEditingUser = signal(false);

  // Onboarding Selection State
  onboardingMode = signal<'individual' | 'bulk' | 'csv'>('individual');

  // Creation State
  showAddGroupForm = signal(false);
  isInviting = signal(false);
  institutionInfo = signal<InstitutionInfo | null>(null);
  private isNameManuallyEdited = false;

  salutations = ['Mr.', 'Ms.', 'Mx.'];
  academicTitles = ['Dr.', 'Prof.', 'Prof. Dr.', 'Dr. h.c.'];

  // Forms
  inviteForm = this.fb.group({
    salutation: [''],
    title: [''],
    email: ['', [Validators.required, Validators.email]],
    role: [UserRole.Student, Validators.required],
    studentNumber: [''],
    courseOfStudy: [''],
    specializationId: ['']
  });

  bulkInviteForm = this.fb.group({
    emails: ['', Validators.required],
    role: [UserRole.Student, Validators.required],
    defaultCourse: [''],
    defaultSpecialization: ['']
  });

  groupForm = this.fb.group({
    courseOfStudy: ['', Validators.required],
    specialization: ['', Validators.required],
    startYear: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    startQuartal: [4, [Validators.required, Validators.min(1), Validators.max(4)]],
    name: ['', Validators.required]
  });

  userEditForm: FormGroup = this.fb.group({
    salutation: [''],
    title: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    enabled: [true, Validators.required],
    studentNumber: [''],
    courseOfStudy: [''],
    courseOfStudyName: [''],
    specializationId: [''],
    specializationName: [''],
    startYear: ['']
  });

  // Signals
  allUsers = this.usersData.asReadonly();
  allGroups = this.groupsData.asReadonly();
  allCoursesData = this.coursesData.asReadonly();
  allSpecializationsData = this.specializationsData.asReadonly();

  // Filter signals
  searchFilter = signal('');
  roleFilter = signal<UserRole | ''>('');
  courseFilter = signal<string | ''>('');
  yearFilter = signal<number | ''>('');
  specializationFilter = signal<string | ''>('');

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
    const specialization = this.specializationFilter();

    return this.allUsers().filter(u => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const matchesSearch = !search || (
        fullName.includes(search) ||
        (u.email || '').toLowerCase().includes(search) ||
        (u.studentNumber || '').toLowerCase().includes(search) ||
        (u.courseOfStudyName || '').toLowerCase().includes(search)
      );

      return matchesSearch && (!role || u.role === role) && (!course || u.courseOfStudyName === course) && (!year || u.startYear === year) && (!specialization || u.specializationName === specialization);
    });
  });

  filteredGroupsList = computed(() => {
    const search = this.searchFilter().toLowerCase();
    const course = this.courseFilter();
    return this.allGroups().filter(g => (!search || g.name.toLowerCase().includes(search)) && (!course || g.courseOfStudy === course));
  });

  getProfileDisplayName(u: any) {
    const parts = [u.salutation, u.title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  getAssociationDisplayName(u: any) {
    const parts = [u.title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  currentGroupMembers = computed(() => {
    const group = this.selectedGroup();
    return group ? group.members : [];
  });

  roles = Object.values(UserRole);

  courses = computed(() => Array.from(new Set(this.coursesData().map(c => c.name))));
  years = computed(() => Array.from(new Set(this.allUsers().map(u => u.startYear).filter(Boolean))).sort());
  specializationsByCourse = computed(() => {
    const courseName = this.courseFilter();
    if (!courseName) return Array.from(new Set(this.specializationsData().map(f => f.name)));
    const courseId = this.coursesData().find(c => c.name === courseName)?.id;
    return this.specializationsData().filter(f => f.courseId === courseId).map(f => f.name);
  });

  groupCourseValue = toSignal(this.groupForm.get('courseOfStudy')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForGroup = computed(() => {
    const courseName = this.groupCourseValue();
    if (!courseName) return [];
    const courseId = this.allCoursesData().find(c => c.name === courseName)?.id;
    return this.allSpecializationsData().filter(f => f.courseId === courseId).map(f => f.name);
  });

  bulkCourseValue = toSignal(this.bulkInviteForm.get('defaultCourse')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForBulk = computed(() => {
    const courseName = this.bulkCourseValue();
    if (!courseName) return [];
    const courseId = this.allCoursesData().find(c => c.name === courseName)?.id;
    return this.allSpecializationsData().filter(f => f.courseId === courseId).map(f => f.name);
  });

  ngOnInit() {
    this.loadAllData();
    this.setupAutocomplete();
    this.setupGroupNameAutoGeneration();
  }

  setupGroupNameAutoGeneration() {
    this.groupForm.get('name')?.valueChanges.subscribe(() => {
      if (this.groupForm.get('name')?.dirty) {
        this.isNameManuallyEdited = true;
      }
    });

    this.groupForm.valueChanges.subscribe(() => {
      if (this.isNameManuallyEdited) return;
      this.generateGroupName();
    });
  }

  generateGroupName() {
    const { courseOfStudy, specialization, startYear, startQuartal } = this.groupForm.value;
    const info = this.institutionInfo();

    if (!courseOfStudy || !specialization || !startYear || !startQuartal || !info) return;

    const campusLetter = (info.city || 'X')[0].toUpperCase();
    const uniLetter = (info.universityName || 'X')[0].toUpperCase();
    const courseLetter = (courseOfStudy || 'X')[0].toUpperCase();
    const specLetter = (specialization || 'X')[0].toUpperCase();
    const quartal = startQuartal;
    const yearDigits = startYear.toString().slice(-2);

    const course = this.coursesData().find(c => c.name === courseOfStudy);
    const degreeLetter = course?.degreeType === DegreeType.Bachelor ? 'A' : 'M';

    const generatedName = `${campusLetter}${uniLetter}${courseLetter}${specLetter}${quartal}${yearDigits}${degreeLetter}`;

    this.groupForm.get('name')?.setValue(generatedName, { emitEvent: false });
  }

  loadAllData() {
    this.adminService.getUsers().subscribe(users => this.usersData.set(users));
    this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
    this.adminService.getCourses().subscribe(courses => this.coursesData.set(courses));
    this.adminService.getSpecializations().subscribe(specializations => this.specializationsData.set(specializations));
    this.adminService.getInstitutionInfo().subscribe(info => this.institutionInfo.set(info));
  }



  setupAutocomplete() {
    this.addMemberControl.valueChanges.pipe(
      startWith(''),
      map(val => {
        const str = (typeof val === 'string' ? val : '').toLowerCase();
        const g = this.selectedGroup();
        if (!g) return [];
        return this.allUsers().filter(u => u.role === UserRole.Student && !g.members.some(m => m.id === u.id) && (this.getAssociationDisplayName(u).toLowerCase().includes(str) || u.studentNumber?.includes(str)));
      })
    ).subscribe(students => this.filteredStudentsAutoComplete.set(students as User[]));
  }

  switchView(view: 'directory' | 'groups' | 'onboarding') {
    this.activeView.set(view);
    this.selectedGroup.set(null);
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
        this.notificationService.showSuccess('userManagement.userUpdateSuccess');
      });
    }
  }

  selectGroup(group: StudyGroup) { this.selectedGroup.set(group); }

  // Common Actions
  sendInvitation() {
    if (this.inviteForm.invalid || this.isInviting()) return;
    this.isInviting.set(true);
    const invData = this.inviteForm.value as InvitationPayload;
    this.adminService.inviteUser(invData).pipe(
      finalize(() => this.isInviting.set(false))
    ).subscribe(() => {
      this.notificationService.showSuccess('userManagement.invitationSuccess');
      this.inviteForm.reset({ role: invData.role });
    });
  }

  sendBulkInvitations() {
    if (this.bulkInviteForm.invalid || this.isInviting()) return;
    const { emails, role, defaultCourse, defaultSpecialization } = this.bulkInviteForm.value;
    if (emails && role) {
      this.isInviting.set(true);
      const lines = emails.split('\n').filter(Boolean);
      const invitations = lines.map(line => {
        const parts = line.split(';').map(p => p.trim());
        const hasId = parts[1] && /^\d+$/.test(parts[1]); // Check if 2nd col is ID
        return {
          email: parts[0],
          studentNumber: hasId ? parts[1] : undefined,
          role: role as UserRole,
          courseOfStudy: defaultCourse || undefined,
          specialization: defaultSpecialization || undefined
        };
      });
      this.adminService.bulkInvite(invitations).pipe(
        finalize(() => this.isInviting.set(false))
      ).subscribe(() => {
        this.notificationService.showSuccess('userManagement.invitationSuccess');
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
        const invs = lines.map(l => {
          const parts = l.split(';').map(p => p.trim());
          const hasId = parts[1] && /^\d+$/.test(parts[1]); // Intelligent Shift Helper
          
          return {
            email: parts[0],
            studentNumber: hasId ? parts[1] : undefined,
            firstName: hasId ? parts[2] : parts[1],
            lastName: hasId ? parts[3] : parts[2],
            role: (hasId ? parts[4] : parts[3]) as any || UserRole.Student,
            courseOfStudy: hasId ? parts[5] : parts[4],
            specialization: hasId ? parts[6] : parts[5]
          };
        });
        this.csvInvitations.set(invs);
      };
      reader.readAsText(file);
    }
  }

  sendCsvInvitations() {
    if (this.csvInvitations().length > 0 && !this.isInviting()) {
      this.isInviting.set(true);
      this.adminService.bulkInvite(this.csvInvitations()).pipe(
        finalize(() => this.isInviting.set(false))
      ).subscribe(() => {
        this.notificationService.showSuccess('userManagement.invitationSuccess');
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
      this.groupForm.reset({
        startYear: new Date().getFullYear(),
        startQuartal: 4
      });
      this.isNameManuallyEdited = false;
      this.notificationService.showSuccess('userManagement.addGroupSuccess');
    });
  }

  removeUserFromGroup(userId: string, groupId: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.removeUserFromGroupTitle',
        message: 'academicStructure.removeUserFromGroupMessage'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.removeGroupMember(groupId, userId).subscribe(() => {
          this.groupsData.update(gs => gs.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== userId), memberCount: g.memberCount - 1 } : g));
          if (this.selectedGroup()?.id === groupId) {
            this.selectedGroup.update(g => g ? { ...g, members: g.members.filter(m => m.id !== userId), memberCount: g.memberCount - 1 } : null);
          }
          this.notificationService.showSuccess('academicStructure.removeUserFromGroupSuccess');
        });
      }
    });
  }

  addMember(student: User) {
    const g = this.selectedGroup();
    if (!g) return;
    this.adminService.addGroupMember(g.id, student.id).subscribe(() => {
      const newMember: GroupMember = { id: student.id, firstName: student.firstName, lastName: student.lastName, studentNumber: student.studentNumber || '', title: student.title };
      this.groupsData.update(gs => gs.map(group => group.id === g.id ? { ...group, members: [...group.members, newMember], memberCount: group.memberCount + 1 } : group));
      this.selectedGroup.update(group => group ? { ...group, members: [...group.members, newMember], memberCount: group.memberCount + 1 } : null);
      this.addMemberControl.setValue('');
      this.notificationService.showSuccess('userManagement.addMemberSuccess');
    });
  }

  deleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'userManagement.deleteUserTitle',
        message: 'userManagement.deleteUserMessage'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(user.id).subscribe(() => {
          this.usersData.update(u => u.filter(usr => usr.id !== user.id));
          this.notificationService.showSuccess('userManagement.userDeleteSuccess');
          if (this.selectedUser()?.id === user.id) this.closeUserDrawer();
        });
      }
    });
  }

  closeUserDrawer() { this.isDrawerOpen.set(false); this.selectedUser.set(null); }
  cancelEditing() { this.isEditingUser.set(false); }
  updateSearch(event: Event) { this.searchFilter.set((event.target as HTMLInputElement).value); }
  getUserGroups(userId: string) { return this.allGroups().filter(g => g.members.some(m => m.id === userId)); }
  getEnabledColor(enabled: boolean) { return enabled ? 'primary' : 'warn'; }
  getRoleColor(role: UserRole) { return role === UserRole.Admin ? 'accent' : role === UserRole.Lecturer ? 'primary' : ''; }
}
