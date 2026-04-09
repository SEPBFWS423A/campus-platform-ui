import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  TemplateRef,
  AfterViewInit
} from '@angular/core';
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
import { MatTableModule, MatTable } from '@angular/material/table';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { startWith, finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AdminService, User, StudyGroup, InvitationPayload, CourseOfStudy, Specialization, DegreeType, InstitutionInfo, GroupMember } from '../admin.service';
import { UserRole } from '../../../core/models/user-role';
import { Salutation } from '../../../core/models/salutation';
import { AcademicTitle } from '../../../core/models/academic-title';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { UserService } from '../../../core/user/user.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import { UserProfileOverviewComponent } from '../../../shared/components/user-profile-overview/user-profile-overview';

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
    MatTooltipModule,
    UserProfileOverviewComponent
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
})
export class UserManagement implements OnInit, AfterViewInit {
  private adminService = inject(AdminService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('compactTable') compactTable!: MatTable<any>;
  @ViewChild('groupDialogTemplate') groupDialogTemplate!: TemplateRef<any>;
  @ViewChild('addMemberDialogTemplate') addMemberDialogTemplate!: TemplateRef<any>;

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
  private breakpointObserver = inject(BreakpointObserver);
  sidebarCollapsed = signal(this.breakpointObserver.isMatched('(max-width: 1400px)'));

  // Onboarding Selection State
  onboardingMode = signal<'individual' | 'bulk'>('individual');

  // Creation State
  showAddGroupForm = signal(false);
  editingGroupId = signal<string | null>(null);
  isInviting = signal(false);
  isSavingGroup = signal(false);
  isFirstLoad = signal(true);
  institutionInfo = signal<InstitutionInfo | null>(null);
  private isNameManuallyEdited = false;

  ngAfterViewInit() {
    setTimeout(() => this.isFirstLoad.set(false), 150);
  }

  constructor() {
    // Reactive logic for sidebar minimized state
    this.breakpointObserver.observe(['(max-width: 1400px)']).subscribe(result => {
      this.sidebarCollapsed.set(result.matches);
    });

    // Form field synchronization effects
    this.setupFormStateEffects();
  }

  private setupFormStateEffects() {
    // Individual Invite Specialization
    effect(() => {
      const courseId = this.inviteCourseValue();
      const control = this.inviteForm.get('specialization');
      if (courseId) control?.enable({ emitEvent: false });
      else control?.disable({ emitEvent: false });
    });

    // Bulk Invite Specialization
    effect(() => {
      const courseId = this.bulkCourseValue();
      const control = this.bulkInviteForm.get('defaultSpecialization');
      if (courseId) control?.enable({ emitEvent: false });
      else control?.disable({ emitEvent: false });
    });

    // Group Creation Specialization
    effect(() => {
      const courseId = this.groupCourseValue();
      const control = this.groupForm.get('specialization');
      if (courseId) control?.enable({ emitEvent: false });
      else control?.disable({ emitEvent: false });
    });

    // User Edit Specialization
    effect(() => {
      const courseId = this.editCourseValue();
      const control = this.userEditForm.get('specializationId');
      if (courseId) control?.enable({ emitEvent: false });
      else control?.disable({ emitEvent: false });
    });

    // Auto-fill state sync & lazy loading
    effect(() => {
      const allowed = this.canAutoFill();
      const control = this.groupForm.get('autoFill');
      if (allowed) {
        control?.enable({ emitEvent: false });
        this.ensureUsersLoaded();
      } else {
        control?.disable({ emitEvent: false });
      }
    });

    // Directory view lazy loading
    effect(() => {
      if (this.activeView() === 'directory') {
        this.ensureUsersLoaded();
      }
    });
  }

  private isUsersLoading = false;
  private ensureUsersLoaded() {
    if (this.usersData().length > 0 || this.isUsersLoading) return;

    this.isUsersLoading = true;
    this.adminService.getUsers().pipe(
      finalize(() => this.isUsersLoading = false)
    ).subscribe(users => this.usersData.set(users));
  }

  salutations = Object.values(Salutation);
  academicTitles = Object.values(AcademicTitle);

  // Forms
  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [UserRole.Student, Validators.required],
    studentNumber: [''],
    courseOfStudy: [''],
    specialization: [''],
    startYear: [new Date().getFullYear(), [Validators.min(2000), Validators.max(2100)]],
    startQuartal: [4, [Validators.min(1), Validators.max(4)]],
    language: ['de', Validators.required]
  }, { validators: this.studentFieldsValidator });

  bulkInviteForm = this.fb.group({
    emails: ['', Validators.required],
    role: [UserRole.Student, Validators.required],
    defaultCourse: [''],
    defaultSpecialization: [''],
    defaultStartYear: [new Date().getFullYear(), [Validators.min(2000), Validators.max(2100)]],
    defaultStartQuartal: [4, [Validators.min(1), Validators.max(4)]],
    defaultLanguage: ['de', Validators.required]
  });

  groupForm = this.fb.group({
    courseOfStudy: ['', Validators.required],
    specialization: ['', Validators.required],
    startYear: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    startQuartal: [4, [Validators.required, Validators.min(1), Validators.max(4)]],
    name: ['', Validators.required],
    autoFill: [false]
  });

  private groupFormValue = toSignal(this.groupForm.valueChanges, { initialValue: this.groupForm.value });

  excludedAutoFillIds = signal<Set<string>>(new Set());

  matchingAutoFillStudents = computed(() => {
    const val = this.groupFormValue();
    if (!val || this.editingGroupId()) return [];

    const course = this.allCoursesData().find(c => String(c.id) === String(val.courseOfStudy));
    const spec = this.allSpecializationsData().find(s => s.name === val.specialization && String(s.courseId) === String(course?.id));

    const users = this.usersData();
    const matched = users.filter(u => {
      if (u.role !== UserRole.Student) return false;

      // Resolve course ID (prefer direct ID, fall back to specialization lookup)
      let uCourseId = u.courseOfStudyId || u.courseOfStudy;
      if (!uCourseId && u.specializationId) {
        const sInfo = this.allSpecializationsData().find(s => String(s.id) === String(u.specializationId));
        if (sInfo) uCourseId = sInfo.courseId;
      }

      const match =
        String(uCourseId) === String(val.courseOfStudy) &&
        u.specializationName === spec?.name &&
        Number(u.startYear) === Number(val.startYear) &&
        Number(u.startQuartal) === Number(val.startQuartal);

      return match;
    });

    return matched;
  });

  finalAutoFillStudents = computed(() => {
    const matching = this.matchingAutoFillStudents();
    const excluded = this.excludedAutoFillIds();
    return matching.filter(s => !excluded.has(s.id));
  });

  autoFillCount = computed(() => this.finalAutoFillStudents().length);

  canAutoFill = computed(() => {
    const val = this.groupFormValue();
    return !!val?.courseOfStudy && !!val?.specialization && !!val?.startYear && !!val?.startQuartal;
  });

  toggleAutoFillExclusion(studentId: string) {
    this.excludedAutoFillIds.update(set => {
      const next = new Set(set);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  userEditForm: FormGroup = this.fb.group({
    salutation: [null as Salutation | null],
    title: [null as AcademicTitle | null],
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
    startYear: [''],
    startQuartal: ['']
  });

  // Signals
  allUsers = this.usersData.asReadonly();
  allGroups = this.groupsData.asReadonly();
  allCoursesData = this.coursesData.asReadonly();
  allSpecializationsData = this.specializationsData.asReadonly();

  // Filter signals
  searchFilter = signal('');
  roleFilter = signal<UserRole | ''>('');
  courseIdFilter = signal<string | ''>('');
  yearFilter = signal<number | ''>('');
  specializationFilter = signal<string | ''>('');

  // Student Search / Management
  addMemberControl = new FormControl('');

  private addMemberSearchValue = toSignal(this.addMemberControl.valueChanges, { initialValue: '' });

  filteredStudentsAutoComplete = computed(() => {
    const search = (this.addMemberSearchValue() || '').toLowerCase().trim();
    const users = this.allUsers();
    const group = this.selectedGroup();

    return users.filter(u => {
      if (u.role !== UserRole.Student) return false;

      // Automatically filter by group year and quartal if they exist
      const matchesCohort = !group || (
        (!group.startYear || u.startYear === group.startYear) &&
        (!group.startQuartal || u.startQuartal === group.startQuartal)
      );
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const matchesSearch = !search || (
        fullName.includes(search) ||
        (u.studentNumber || '').toLowerCase().includes(search)
      );

      // Exclude users already in the group and only show students from the same specialization if applicable
      const notInGroup = !group || !group.members.some(m => m.id === u.id);
      const matchesSpecialization = !group || u.specializationName === group.specialization;

      return matchesCohort && matchesSearch && notInGroup && matchesSpecialization;
    }).sort((a, b) => {
      const idA = a.studentNumber || '';
      const idB = b.studentNumber || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  });

  // CSV parsing
  csvFileName = signal<string | null>(null);

  // Derived signals
  filteredUsers = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const role = this.roleFilter();
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

      const courseId = this.courseIdFilter();
      const userCourseId = u.specializationId ? this.allSpecializationsData().find(s => s.id === u.specializationId)?.courseId : null;

      return matchesSearch && (!role || u.role === role) && (!courseId || userCourseId === courseId) && (!year || u.startYear === year) && (!specialization || u.specializationName === specialization);
    });
  });

  filteredGroupsList = computed(() => {
    const search = this.searchFilter().toLowerCase();
    const courseId = this.courseIdFilter();
    return this.allGroups().filter(g => (!search || g.name.toLowerCase().includes(search)) && (!courseId || g.courseOfStudyId === courseId));
  });

  getProfileDisplayName(u: any) {
    const sal = u.salutation ? this.translate.instant('userManagement.salutations.' + u.salutation.toUpperCase()) : '';
    const title = u.title ? this.translate.instant('userManagement.academicTitles.' + u.title.toUpperCase()) : '';
    const parts = [sal, title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  getAssociationDisplayName(u: any) {
    const title = u.title ? this.translate.instant('userManagement.academicTitles.' + u.title) : '';
    const parts = [title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  displayStudent = (user: User | null): string => {
    return user ? `${this.getAssociationDisplayName(user)} (${user.studentNumber})` : '';
  };

  currentGroupMembers = computed(() => {
    const group = this.selectedGroup();
    if (!group) return [];
    return [...group.members].sort((a, b) => {
      const idA = a.studentNumber || '';
      const idB = b.studentNumber || '';
      return idA.localeCompare(idB, undefined, { numeric: true });
    });
  });

  roles = Object.values(UserRole);

  courses = computed(() => this.coursesData());
  years = computed(() => Array.from(new Set(this.allUsers().map(u => u.startYear).filter(Boolean))).sort());

  specializationsByCourse = computed(() => {
    const courseId = this.courseIdFilter();
    if (!courseId) return [];
    return this.specializationsData().filter(f => f.courseId === courseId).map(f => f.name);
  });

  inviteCourseValue = toSignal(this.inviteForm.get('courseOfStudy')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForIndividual = computed(() => {
    const courseId = this.inviteCourseValue();
    if (!courseId) return [];
    return this.allSpecializationsData().filter(f => f.courseId === courseId);
  });

  editCourseValue = toSignal(this.userEditForm.get('courseOfStudy')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForEdit = computed(() => {
    const courseId = this.editCourseValue();
    if (!courseId) return [];
    return this.allSpecializationsData().filter(f => f.courseId === courseId);
  });

  groupCourseValue = toSignal(this.groupForm.get('courseOfStudy')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForGroup = computed(() => {
    const courseId = this.groupCourseValue();
    if (!courseId) return [];
    return this.allSpecializationsData().filter(f => f.courseId === courseId).map(f => f.name);
  });

  bulkCourseValue = toSignal(this.bulkInviteForm.get('defaultCourse')!.valueChanges.pipe(startWith('')), { initialValue: '' });

  availableSpecializationsForBulk = computed(() => {
    const courseId = this.bulkCourseValue();
    if (!courseId) return [];
    return this.allSpecializationsData().filter(f => f.courseId === courseId);
  });

  ngOnInit() {
    this.loadAllData();
    this.setupGroupNameAutoGeneration();
    this.setupDependentFieldsClearing();
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
    const { courseOfStudy: courseId, specialization, startYear, startQuartal } = this.groupForm.value;
    const info = this.institutionInfo();

    if (!courseId || !specialization || !startYear || !startQuartal || !info) return;

    const course = this.allCoursesData().find(c => c.id === courseId);
    if (!course) return;

    const campusLetter = (info.city || 'X')[0].toUpperCase();
    const uniLetter = (info.universityName || 'X')[0].toUpperCase();
    const courseLetter = (course.name || 'X')[0].toUpperCase();
    const specLetter = (specialization || 'X')[0].toUpperCase();
    const quartal = startQuartal;
    const yearDigits = startYear.toString().slice(-2);

    const degreeLetter = course.degreeType === DegreeType.Bachelor ? 'A' : 'M';

    const generatedName = `${campusLetter}${uniLetter}${courseLetter}${specLetter}${quartal}${yearDigits}${degreeLetter}`;

    this.groupForm.get('name')?.setValue(generatedName, { emitEvent: false });
  }


  loadAllData() {
    this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
    this.adminService.getCourses().subscribe(courses => this.coursesData.set(courses));
    this.adminService.getSpecializations().subscribe(specializations => this.specializationsData.set(specializations));
    this.userService.getInstitutionInfo().subscribe(info => this.institutionInfo.set(info));
  }

  // Validator to ensure Course and Specialization are selected for a Student
  studentFieldsValidator(group: any) {
    const role = group.get('role')?.value;
    if (role === UserRole.Student) {
      const course = group.get('courseOfStudy')?.value;
      const spec = group.get('specialization')?.value;
      if (!course || !spec) {
        return { studentFieldsRequired: true };
      }
    }
    return null;
  }

  setupDependentFieldsClearing() {
    this.inviteForm.get('courseOfStudy')?.valueChanges.subscribe(() => {
      this.inviteForm.patchValue({ specialization: '' }, { emitEvent: false });
      this.inviteForm.get('specialization')?.markAsUntouched();
    });

    this.bulkInviteForm.get('defaultCourse')?.valueChanges.subscribe(() => {
      this.bulkInviteForm.patchValue({ defaultSpecialization: '' }, { emitEvent: false });
      this.bulkInviteForm.get('defaultSpecialization')?.markAsUntouched();
    });

    this.groupForm.get('courseOfStudy')?.valueChanges.subscribe(() => {
      this.groupForm.patchValue({ specialization: '' }, { emitEvent: false });
      this.groupForm.get('specialization')?.markAsUntouched();
    });

    this.userEditForm.get('courseOfStudy')?.valueChanges.subscribe(() => {
      this.userEditForm.patchValue({ specializationId: '' }, { emitEvent: false });
      this.userEditForm.get('specializationId')?.markAsUntouched();
    });
  }




  switchView(view: 'directory' | 'groups' | 'onboarding') {
    this.activeView.set(view);
    this.searchFilter.set('');
    this.selectedGroup.set(null);
    this.isDrawerOpen.set(false);
  }

  selectUser(user: User) { this.selectedUser.set(user); this.isDrawerOpen.set(true); this.isEditingUser.set(false); }

  selectMember(member: any) {
    this.ensureUsersLoaded();
    const fullUser = this.allUsers().find(u => u.id === member.id);
    if (fullUser) {
      this.selectUser(fullUser);
    }
  }

  startEditing() {
    const user = this.selectedUser();
    if (user) {
      const courseId = user.specializationId ? this.allSpecializationsData().find(s => s.id === user.specializationId)?.courseId : null;
      this.userEditForm.patchValue({
        ...user,
        courseOfStudy: courseId
      });
      this.isEditingUser.set(true);
    }
  }
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
    const formVal = this.inviteForm.value;

    const invData: InvitationPayload = {
      email: formVal.email!,
      role: formVal.role!,
      studentNumber: formVal.studentNumber || undefined,
      specializationId: Number(formVal.specialization) || undefined,
      startYear: formVal.startYear || new Date().getFullYear(),
      startQuartal: formVal.startQuartal || 4,
      language: formVal.language || 'de'
    };

    this.adminService.inviteUser(invData).pipe(
      finalize(() => this.isInviting.set(false))
    ).subscribe(() => {
      this.notificationService.showSuccess('userManagement.invitationSuccess', { email: invData.email });
      this.inviteForm.reset({ role: formVal.role! });
    });
  }

  sendBulkInvitations() {
    if (this.bulkInviteForm.invalid || this.isInviting()) return;
    const { emails, role, defaultCourse, defaultSpecialization, defaultStartYear, defaultStartQuartal, defaultLanguage } = this.bulkInviteForm.value;
    if (emails && role) {
      this.isInviting.set(true);
      const lines = emails.split('\n').filter(Boolean);
      const invitations = lines.map(line => {
        const parts = line.split(';').map(p => p.trim());
        const hasId = parts[1] && /^\d+$/.test(parts[1]); // Check if 2nd col is ID

        // Mapping: email; [id]; [role]; [course]; [spec]; [year]; [quartal]; [lang]
        const csvRole = (hasId ? parts[2] : parts[1]);
        const csvCourse = (hasId ? parts[3] : parts[2]);
        const csvSpec = (hasId ? parts[4] : parts[3]);
        const csvYear = (hasId ? parts[5] : parts[4]);
        const csvQuartal = (hasId ? parts[6] : parts[5]);
        const csvLang = hasId ? parts[7] : parts[6];

        const normalizedRole = this.normalizeRole(csvRole);
        const selectedCourseName = defaultCourse ? this.allCoursesData().find(c => c.id === defaultCourse)?.name : undefined;

        return {
          email: parts[0],
          studentNumber: hasId ? parts[1] : undefined,
          role: normalizedRole || (role as UserRole),
          courseOfStudy: csvCourse || selectedCourseName,
          specializationId: csvSpec ? Number(csvSpec) : (defaultSpecialization ? Number(defaultSpecialization) : undefined),
          startYear: csvYear ? Number(csvYear) : (defaultStartYear || new Date().getFullYear()),
          startQuartal: csvQuartal ? Number(csvQuartal) : (defaultStartQuartal || 4),
          language: csvLang || defaultLanguage || 'de'
        } as InvitationPayload;
      });

      this.adminService.bulkInvite(invitations).pipe(
        finalize(() => this.isInviting.set(false))
      ).subscribe(() => {
        this.notificationService.showSuccess('userManagement.bulkInvitationSuccess');
        this.bulkInviteForm.reset({ role: UserRole.Student });
      });
    }
  }

  private normalizeRole(roleStr: string | undefined): UserRole | null {
    if (!roleStr) return null;
    const s = roleStr.trim().toUpperCase();
    if (['STUDENT', 'STUDIERENDER', 'STUDIERENDE'].includes(s)) return UserRole.Student;
    if (['LECTURER', 'DOZENT', 'DOZENTIN', 'LEHRKRAFT'].includes(s)) return UserRole.Lecturer;
    if (['ADMIN', 'ADMINISTRATOR', 'ADMINISTRATORIN'].includes(s)) return UserRole.Admin;
    return null;
  }

  importBatchFromFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.notificationService.showSuccess('userManagement.importRunning');
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv' || extension === 'txt') {
      reader.onload = (e: any) => {
        this.appendBatchData(e.target.result);
      };
      reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
        this.appendBatchData(csv);
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === 'docx') {
      reader.onload = (e: any) => {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then((result) => {
            this.appendBatchData(result.value);
          })
          .catch(err => {
            console.error('Error parsing docx', err);
            this.notificationService.showError('userManagement.wordReadError');
          });
      };
      reader.readAsArrayBuffer(file);
    } else {
      this.notificationService.showError('userManagement.formatNotSupported');
    }

    // Reset input so same file can be selected again
    event.target.value = '';
  }

  private appendBatchData(newText: string) {
    if (!newText) return;

    let lines = newText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Detect and skip header row
    // If the first line doesn't contain an '@' but contains a separator, it's highly likely a header
    const firstLine = lines[0];
    if (firstLine.includes(';') && !firstLine.includes('@')) {
      lines.shift();
    }

    if (lines.length === 0) return;

    const cleanNewText = lines.join('\n');
    const current = this.bulkInviteForm.get('emails')?.value || '';

    const updated = current
      ? (current.trim() + '\n' + cleanNewText)
      : cleanNewText;

    this.bulkInviteForm.patchValue({ emails: updated });
    this.notificationService.showSuccess('userManagement.importSuccess');
  }

  saveGroup() {
    if (this.groupForm.invalid) return;
    const formVal = this.groupForm.value as any;

    // Find IDs by name because the form controls store string names for auto-generation logic
    const course = this.allCoursesData().find(c => c.id === formVal.courseOfStudy);
    const spec = this.allSpecializationsData().find(s => s.name === formVal.specialization && s.courseId === course?.id);

    const payload: Partial<StudyGroup> = {
      name: formVal.name,
      courseOfStudyId: course?.id,
      courseOfStudyName: course?.name,
      specializationId: spec?.id,
      specialization: spec?.name,
      startYear: formVal.startYear,
      startQuartal: formVal.startQuartal
    };

    const editingId = this.editingGroupId();
    this.isSavingGroup.set(true);

    if (editingId) {
      this.adminService.updateGroup(editingId, payload).pipe(
        finalize(() => this.isSavingGroup.set(false))
      ).subscribe({
        next: (updatedGroup) => {
          const sid = String(editingId);

          this.groupsData.update(groups => {
            return groups.map(gr => {
              if (String(gr.id) === sid) {
                return {
                  ...gr,
                  ...(updatedGroup || {}),
                  id: String(updatedGroup?.id || gr.id),
                  courseOfStudyName: course?.name || updatedGroup?.courseOfStudyName || gr.courseOfStudyName,
                  specialization: spec?.name || updatedGroup?.specialization || gr.specialization
                };
              }
              return gr;
            });
          });

          const currentSelected = this.selectedGroup();
          if (currentSelected && String(currentSelected.id) === sid) {
            this.selectedGroup.set({
              ...currentSelected,
              ...(updatedGroup || {}),
              id: String(updatedGroup?.id || currentSelected.id),
              courseOfStudyName: course?.name || updatedGroup?.courseOfStudyName || currentSelected.courseOfStudyName,
              specialization: spec?.name || updatedGroup?.specialization || currentSelected.specialization
            });
          }

          this.closeGroupDialog();
          this.notificationService.showSuccess('userManagement.updateGroupSuccess');
        },
        error: (err) => console.error('Error updating group:', err)
      });
    } else {
      this.adminService.createGroup(payload).pipe(
        finalize(() => this.isSavingGroup.set(false))
      ).subscribe({
        next: (newGroup) => {
          if (!newGroup) {
            console.warn('Backend returned empty body for group creation, re-fetching list...');
            this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
          } else {
            console.log('Group created successfully:', newGroup);
            const completeGroup: StudyGroup = {
              ...newGroup,
              id: String(newGroup.id),
              courseOfStudyName: course?.name || newGroup.courseOfStudyName,
              specialization: spec?.name || newGroup.specialization,
              members: newGroup.members || [],
              memberCount: newGroup.memberCount || 0
            };
            this.groupsData.update(groups => [...groups, completeGroup]);
          }

          this.closeGroupDialog();
          this.notificationService.showSuccess('userManagement.addGroupSuccess');

          // AUTO-FILL LOGIC: Add matching students (excluding manually deselected ones)
          if (formVal.autoFill && newGroup) {
            const matchingStudents = this.finalAutoFillStudents();

            if (matchingStudents.length > 0) {
              const addObs = matchingStudents.map(s => this.adminService.addGroupMember(String(newGroup.id), s.id));
              forkJoin(addObs).subscribe(() => {
                // Refresh to show absolute correct state
                this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
              });
            }
          }
        },
        error: (err) => console.error('Error creating group:', err)
      });
    }
  }

  editSelectedGroup() {
    const group = this.selectedGroup();
    if (!group) return;

    this.editingGroupId.set(group.id);
    this.isNameManuallyEdited = true; // Prevents auto-generation from overwriting the raw name

    // Try to extract original manual name part from generated name
    let rawName = group.name;
    const match = group.name.match(/(\d)(\d{2})(.+)([A-Z])$/);
    if (match) {
      // If it looks like generated name, the middle part is the raw name
      rawName = match[3];
    }

    this.groupForm.patchValue({
      name: rawName,
      courseOfStudy: group.courseOfStudyId,
      specialization: group.specialization,
      startYear: group.name.match(/(\d{2})[A-Z]$/) ? 2000 + parseInt(group.name.match(/(\d{2})/)?.[0] || '24', 10) : new Date().getFullYear(),
      startQuartal: group.name.match(/(\d)\d{2}/) ? parseInt(group.name.match(/(\d)\d{2}/)?.[1] || '4', 10) : 4
    });

    const ref = this.dialog.open(this.groupDialogTemplate, {
      width: 'auto',
      maxWidth: '95vw',
      disableClose: false
    });
    ref.afterClosed().subscribe(() => this.resetGroupDialogState());
  }

  openCreateGroupDialog() {
    this.editingGroupId.set(null);
    this.excludedAutoFillIds.set(new Set());
    this.groupForm.reset({ startYear: new Date().getFullYear(), startQuartal: 4, autoFill: false });
    this.isNameManuallyEdited = false;
    const ref = this.dialog.open(this.groupDialogTemplate, {
      width: 'auto',
      maxWidth: '95vw',
      disableClose: false
    });
    ref.afterClosed().subscribe(() => this.resetGroupDialogState());
  }

  closeGroupDialog() {
    this.dialog.closeAll();
  }

  private resetGroupDialogState() {
    this.editingGroupId.set(null);
    this.groupForm.reset({ startYear: new Date().getFullYear(), startQuartal: 4, autoFill: false });
    this.excludedAutoFillIds.set(new Set());
    this.isNameManuallyEdited = false;
  }

  cancelEditGroup() {
    this.closeGroupDialog();
  }

  deleteSelectedGroup() {
    const group = this.selectedGroup();
    if (!group) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'userManagement.deleteGroupTitle',
        message: 'userManagement.deleteGroupMessage'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteGroup(group.id).subscribe(() => {
          this.groupsData.update(gs => gs.filter(g => g.id !== group.id));
          this.selectedGroup.set(null);
          this.notificationService.showSuccess('userManagement.deleteGroupSuccess');
        });
      }
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
            if (this.compactTable) this.compactTable.renderRows();
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
      if (this.compactTable) this.compactTable.renderRows();
      this.addMemberControl.setValue('');
      this.notificationService.showSuccess('userManagement.addMemberSuccess');
    });
  }

  openAddMemberDialog() {
    this.addMemberControl.setValue('');
    this.dialog.open(this.addMemberDialogTemplate, {
      width: '600px',
      disableClose: false
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

