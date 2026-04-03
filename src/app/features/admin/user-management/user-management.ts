import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef, TemplateRef } from '@angular/core';
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
import { startWith, map, finalize } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
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
    MatTooltipModule,
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
  @ViewChild('compactTable') compactTable!: MatTable<any>;
  @ViewChild('groupDialogTemplate') groupDialogTemplate!: TemplateRef<any>;

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
  editingGroupId = signal<string | null>(null);
  isInviting = signal(false);
  isSavingGroup = signal(false);
  institutionInfo = signal<InstitutionInfo | null>(null);
  private isNameManuallyEdited = false;

  salutations = ['Mr.', 'Ms.', 'Mx.'];
  academicTitles = ['Dr.', 'Prof.', 'Prof. Dr.', 'Dr. h.c.'];

  // Forms
  inviteForm = this.fb.group({
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
  courseIdFilter = signal<string | ''>('');
  yearFilter = signal<number | ''>('');
  specializationFilter = signal<string | ''>('');

  // Auto-complete
  addMemberControl = new FormControl('');
  addMemberYearControl = new FormControl<number | null>(null);
  filteredStudentsAutoComplete = signal<User[]>([]);

  // CSV parsing
  csvFileName = signal<string | null>(null);
  csvInvitations = signal<InvitationPayload[]>([]);

  // Derived signals
  filteredUsers = computed(() => {
    const search = (this.searchFilter() || '').toLowerCase().trim();
    const role = this.roleFilter();
    const courseId = this.courseIdFilter();
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
    const parts = [u.salutation, u.title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  getAssociationDisplayName(u: any) {
    const parts = [u.title, u.firstName, u.lastName].filter(p => !!p);
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
    return this.allSpecializationsData().filter(f => f.courseId === courseId).map(f => f.name);
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
    this.adminService.getUsers().subscribe(users => this.usersData.set(users));
    this.adminService.getGroups().subscribe(groups => this.groupsData.set(groups));
    this.adminService.getCourses().subscribe(courses => this.coursesData.set(courses));
    this.adminService.getSpecializations().subscribe(specializations => this.specializationsData.set(specializations));
    this.adminService.getInstitutionInfo().subscribe(info => this.institutionInfo.set(info));
  }



  setupAutocomplete() {
    combineLatest([
      this.addMemberControl.valueChanges.pipe(startWith('')),
      this.addMemberYearControl.valueChanges.pipe(startWith(this.addMemberYearControl.value))
    ]).pipe(
      map(([val, filterYear]) => {
        const str = (typeof val === 'string' ? val : '').toLowerCase();
        const g = this.selectedGroup();
        if (!g) return [];
        const filtered = this.allUsers().filter(u =>
          u.role === UserRole.Student &&
          u.specializationName === g.specialization &&
          (!filterYear || u.startYear === filterYear) &&
          !g.members.some(m => m.id === u.id) &&
          (this.getAssociationDisplayName(u).toLowerCase().includes(str) || u.studentNumber?.includes(str))
        );
        return filtered.sort((a, b) => {
          const idA = a.studentNumber || '';
          const idB = b.studentNumber || '';
          return idA.localeCompare(idB, undefined, { numeric: true });
        });
      })
    ).subscribe(students => this.filteredStudentsAutoComplete.set(students as User[]));
  }

  switchView(view: 'directory' | 'groups' | 'onboarding') {
    this.activeView.set(view);
    this.selectedGroup.set(null);
    this.isDrawerOpen.set(false);
  }

  selectUser(user: User) { this.selectedUser.set(user); this.isDrawerOpen.set(true); this.isEditingUser.set(false); }
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
        
        // Mapping: email; [id]; [role]; [course]; [spec]
        const csvRole = (hasId ? parts[2] : parts[1]);
        const csvCourse = (hasId ? parts[3] : parts[2]);
        const csvSpec = (hasId ? parts[4] : parts[3]);

        const normalizedRole = this.normalizeRole(csvRole);
        const selectedCourseName = defaultCourse ? this.allCoursesData().find(c => c.id === defaultCourse)?.name : undefined;

        return {
          email: parts[0],
          studentNumber: hasId ? parts[1] : undefined,
          role: normalizedRole || (role as UserRole),
          courseOfStudy: csvCourse || selectedCourseName,
          specialization: csvSpec || defaultSpecialization || undefined
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

  private normalizeRole(roleStr: string | undefined): UserRole | null {
    if (!roleStr) return null;
    const s = roleStr.trim().toUpperCase();
    if (['STUDENT', 'STUDIERENDER', 'STUDIERENDE'].includes(s)) return UserRole.Student;
    if (['LECTURER', 'DOZENT', 'DOZENTIN', 'LEHRKRAFT'].includes(s)) return UserRole.Lecturer;
    if (['ADMIN', 'ADMINISTRATOR', 'ADMINISTRATORIN'].includes(s)) return UserRole.Admin;
    return null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.csvFileName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
        const invs = lines.map((l: string) => {
          const parts = l.split(';').map(p => p.trim());
          const hasId = parts[1] && /^\d+$/.test(parts[1]); // Intelligent Shift Helper

          const rawRole = hasId ? parts[2] : parts[1];
          const role = this.normalizeRole(rawRole) || UserRole.Student;

          return {
            email: parts[0],
            studentNumber: hasId ? parts[1] : undefined,
            role: role,
            courseOfStudy: hasId ? parts[3] : parts[2],
            specialization: hasId ? parts[4] : parts[3]
          } as InvitationPayload;
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
      specialization: spec?.name
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

    const course = this.allCoursesData().find(c => c.name === group.courseOfStudyName);
    const spec = this.allSpecializationsData().find(s => s.name === group.specialization);

    // Try to extract original manual name part from generated name
    let rawName = group.name;
    const match = group.name.match(/(\d)(\d{2})(.+)([A-Z])$/);
    if (match) {
      // If it looks like generated name, the middle part is the raw name
      rawName = match[3];
    }

    this.groupForm.patchValue({
      name: rawName,
      courseOfStudy: group.courseOfStudyName,
      specialization: group.specialization,
      startYear: group.name.match(/(\d{2})[A-Z]$/) ? 2000 + parseInt(group.name.match(/(\d{2})/)?.[0] || '24', 10) : new Date().getFullYear(),
      startQuartal: group.name.match(/(\d)\d{2}/) ? parseInt(group.name.match(/(\d)\d{2}/)?.[1] || '4', 10) : 4
    });

    this.dialog.open(this.groupDialogTemplate, {
      width: '600px',
      disableClose: true
    });
  }

  openCreateGroupDialog() {
    this.editingGroupId.set(null);
    this.groupForm.reset({ startYear: new Date().getFullYear(), startQuartal: 4 });
    this.isNameManuallyEdited = false;
    this.dialog.open(this.groupDialogTemplate, {
      width: '600px',
      disableClose: true
    });
  }

  closeGroupDialog() {
    this.editingGroupId.set(null);
    this.groupForm.reset({ startYear: new Date().getFullYear(), startQuartal: 4 });
    this.isNameManuallyEdited = false;
    this.dialog.closeAll();
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
