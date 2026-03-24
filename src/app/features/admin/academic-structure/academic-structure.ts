import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AdminService, CourseOfStudy, Specialization, Module, User, UserRole, DegreeType, InstitutionInfo, ModuleExam, ModuleLecturer } from '../admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-academic-structure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatMenuModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './academic-structure.html',
  styleUrls: ['./academic-structure.scss'],
})
export class AcademicStructure implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  public translate = inject(TranslateService);

  // Data signals
  courses = signal<CourseOfStudy[]>([]);
  specializations = signal<Specialization[]>([]);
  modules = signal<Module[]>([]);
  lecturers = signal<User[]>([]);
  universityInfo = signal<InstitutionInfo | null>(null);

  // View state
  activeView = signal<'structure' | 'modules' | 'university' | 'exam-types'>('university');
  examTypes = signal<ModuleExam[]>([]);
  isDrawerOpen = signal(false);
  showAddCourseForm = signal(false);
  showAddSpecializationForm = signal(false);
  showAddModuleForm = signal(false);
  showAddExamTypeForm = signal(false);
  selectedModule = signal<Module | null>(null);

  selectedPossibleExamTypes = signal<ModuleExam[]>([]);

  // Filters
  moduleSearchFilter = signal('');
  moduleCourseNameFilter = signal<string | ''>('');
  moduleDegreeFilter = signal<DegreeType | ''>('');
  moduleSpecializationFilter = signal<string | ''>('');
  moduleSemesterFilter = signal<number | ''>('');

  // Degree Types
  degreeTypes = Object.values(DegreeType);

  // Forms
  courseForm = this.fb.group({
    name: ['', Validators.required],
    degreeType: [DegreeType.Bachelor, Validators.required]
  });

  get courseNameFormControl() { return this.courseForm.get('name') as FormControl; }

  specializationForm = this.fb.group({
    name: ['', Validators.required],
    courseId: ['', Validators.required]
  });

  get specializationNameFormControl() { return this.specializationForm.get('name') as FormControl; }

  moduleForm = this.fb.group({
    name: ['', Validators.required],
    semester: [1, [Validators.required, Validators.min(1)]],
    requiredTotalHours: [0, [Validators.required, Validators.min(0)]],
    possibleExamTypes: [[] as ModuleExam[], Validators.required],
    preferredExamTypeId: [undefined as string | undefined],
    lecturers: [[] as ModuleLecturer[]],
    courseOfStudyId: ['', Validators.required],
    specializationId: ['']
  });

  examTypeForm = this.fb.group({
    type: ['', Validators.required],
    nameDe: ['', Validators.required],
    nameEn: ['', Validators.required],
    shortDe: ['', Validators.required],
    shortEn: ['', Validators.required]
  });

  universityForm = this.fb.group({
    universityName: ['', Validators.required],
    city: ['', Validators.required],
    sekretariatEmail: ['', [Validators.required, Validators.email]],
    sekretariatPhone: ['', Validators.required],
    sekretariatOpeningTimes: ['', Validators.required],
    websiteEmail: ['', [Validators.required, Validators.email]],
    bibliothekUrl: ['', Validators.required],
    mensaUrl: ['', Validators.required],
    impressum: ['', Validators.required]
  });

  // Remove static examTypes list as we now load it from backend
  // examTypes = Object.values(ExamType).map(type => ({ type, name: type.replace('_', ' ') } as ModuleExam));

  // Computed
  semesters = computed(() => {
    return Array.from(new Set(this.modules().map(m => m.semester))).sort((a, b) => a - b);
  });

  uniqueCourseNames = computed(() => {
    const names = this.courses().map(c => c.name);
    return Array.from(new Set(names)).sort();
  });

  filteredModules = computed(() => {
    const search = this.moduleSearchFilter().toLowerCase().trim();
    const courseName = this.moduleCourseNameFilter();
    const degree = this.moduleDegreeFilter();
    const specializationId = this.moduleSpecializationFilter();
    const semester = this.moduleSemesterFilter();

    return this.modules().filter(m => {
      const course = this.courses().find(c => c.id === m.courseOfStudyId);
      const matchesSearch = !search || m.name.toLowerCase().includes(search);
      const matchesCourse = !courseName || course?.name === courseName;
      const matchesDegree = !degree || course?.degreeType === degree;
      const matchesSpecialization = !specializationId || m.specializationId === specializationId;
      const matchesSemester = semester === '' || m.semester === semester;
      return matchesSearch && matchesCourse && matchesDegree && matchesSpecialization && matchesSemester;
    });
  });

  availableSpecializationsForModuleForm = computed(() => {
    const courseId = this.moduleForm.get('courseOfStudyId')?.value;
    if (!courseId) return [];
    return this.specializations().filter(f => f.courseId === courseId);
  });

  availableSpecializationsForFilter = computed(() => {
    const courseName = this.moduleCourseNameFilter();
    const degree = this.moduleDegreeFilter();
    
    let filteredCourses = this.courses();
    if (courseName) filteredCourses = filteredCourses.filter(c => c.name === courseName);
    if (degree) filteredCourses = filteredCourses.filter(c => c.degreeType === degree);
    
    const courseIds = filteredCourses.map(c => c.id);
    if (courseIds.length === 0 && (courseName || degree)) return [];
    
    if (!courseName && !degree) return this.specializations();
    
    return this.specializations().filter(f => courseIds.includes(f.courseId));
  });

  ngOnInit() {
    this.loadData();

    this.moduleForm.get('possibleExamTypes')?.valueChanges.subscribe(val => {
      const selected = val || [];
      this.selectedPossibleExamTypes.set(selected);

      const preferredId = this.moduleForm.get('preferredExamTypeId')?.value;
      if (preferredId && !selected.some(et => et.id === preferredId)) {
        this.moduleForm.get('preferredExamTypeId')?.setValue(undefined);
      }
    });
  }

  loadData() {
    this.adminService.getCourses().subscribe(c => this.courses.set(c));
    this.adminService.getSpecializations().subscribe(s => this.specializations.set(s));
    this.adminService.getModules().subscribe(m => this.modules.set(m));
    this.adminService.getUsers().subscribe(u => {
      this.lecturers.set(u.filter(user => user.role === UserRole.Lecturer));
    });
    this.adminService.getInstitutionInfo().subscribe(info => {
      this.universityInfo.set(info);
      this.universityForm.patchValue(info);
    });
    this.adminService.getExamTypes().subscribe(et => this.examTypes.set(et));
  }



  switchView(view: 'structure' | 'modules' | 'university' | 'exam-types') {
    this.activeView.set(view);
    this.isDrawerOpen.set(false);
  }

  // --- University CRUD ---
  saveUniversityInfo() {
    if (this.universityForm.invalid) return;
    const info = this.universityForm.value as InstitutionInfo;
    this.adminService.updateInstitutionInfo(info).subscribe(res => {
      this.universityInfo.set(res);
      this.notificationService.showSuccess('common.success');
    });
  }

  // --- Course CRUD ---
  addCourse() {
    if (this.courseForm.invalid) return;
    this.adminService.createCourse(this.courseForm.value as any).subscribe(c => {
      this.courses.update(list => [...list, c]);
      this.courseForm.reset({ degreeType: DegreeType.Bachelor });
      this.showAddCourseForm.set(false);
      this.notificationService.showSuccess('academicStructure.deleteCourseSuccess'); // or addCourseSuccess
    });
  }

  deleteCourse(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteCourseTitle',
        message: 'academicStructure.deleteCourseMessage'
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteCourse(id).subscribe(() => {
          this.courses.update(list => list.filter(c => c.id !== id));
          this.specializations.update(list => list.filter(f => f.courseId !== id));
          this.modules.update(list => list.filter(m => m.courseOfStudyId !== id));
          this.notificationService.showSuccess('academicStructure.deleteCourseSuccess');
        });
      }
    });
  }

  // --- Specialization CRUD ---
  addSpecialization() {
    if (this.specializationForm.invalid) return;
    this.adminService.createSpecialization(this.specializationForm.value as any).subscribe(s => {
      this.specializations.update(list => [...list, s]);
      this.specializationForm.reset({ courseId: s.courseId });
      this.showAddSpecializationForm.set(false);
      this.notificationService.showSuccess('academicStructure.deleteSpecializationSuccess'); // or addSpecializationSuccess
    });
  }

  deleteSpecialization(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteSpecializationTitle',
        message: 'academicStructure.deleteSpecializationMessage'
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteSpecialization(id).subscribe(() => {
          this.specializations.update(list => list.filter(f => f.id !== id));
          this.notificationService.showSuccess('academicStructure.deleteSpecializationSuccess');
        });
      }
    });
  }

  // --- Module CRUD ---
  addModule() {
    if (this.moduleForm.invalid) return;
    const formValue = this.moduleForm.value;
    const modulePayload = {
      ...formValue,
      examTypeIds: formValue.possibleExamTypes?.map(et => et.id),
      preferredExamTypeId: formValue.preferredExamTypeId,
      lecturerIds: formValue.lecturers?.map(l => l.id)
    };
    this.adminService.createModule(modulePayload as any).subscribe(m => {
      this.modules.update(list => [...list, m]);
      this.moduleForm.reset({ semester: 1, requiredTotalHours: 0 });
      this.showAddModuleForm.set(false);
      this.notificationService.showSuccess('academicStructure.deleteModuleSuccess'); // or addModuleSuccess
    });
  }

  deleteModule(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteModuleTitle',
        message: 'academicStructure.deleteModuleMessage'
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteModule(id).subscribe(() => {
          this.modules.update(list => list.filter(m => m.id !== id));
          this.notificationService.showSuccess('academicStructure.deleteModuleSuccess');
        });
      }
    });
  }

  // --- Exam Type CRUD ---
  addExamType() {
    if (this.examTypeForm.invalid) return;
    this.adminService.createExamType(this.examTypeForm.value as any).subscribe(et => {
      this.examTypes.update(list => [...list, et]);
      this.examTypeForm.reset();
      this.showAddExamTypeForm.set(false);
      this.notificationService.showSuccess('common.success');
    });
  }

  deleteExamType(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteExamTypeTitle',
        message: 'academicStructure.deleteExamTypeMessage'
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteExamType(id).subscribe(() => {
          this.examTypes.update(list => list.filter(et => et.id !== id));
          this.notificationService.showSuccess('common.success');
        });
      }
    });
  }

  // Helpers
  getSpecializationsForCourse(courseId: string) {
    return this.specializations().filter(f => f.courseId === courseId);
  }

  getModulesForCourse(courseId: string) {
    return this.modules().filter(m => m.courseOfStudyId === courseId);
  }

  getCourseName(courseId: string) {
    return this.courses().find(c => c.id === courseId)?.name || 'Unknown Course';
  }

  getSpecializationName(specializationId?: string) {
    if (!specializationId) return '-';
    return this.specializations().find(f => f.id === specializationId)?.name || '-';
  }

  getFullDisplayName(u: any) {
    const parts = [u.title, u.firstName, u.lastName].filter(p => !!p);
    return parts.join(' ');
  }

  getLecturerNames(module: Module) {
    return module.lecturers.map(l => this.getFullDisplayName(l)).join(', ') || 'No lecturers assigned';
  }

  getExamTypeNames(module: Module) {
    return module.possibleExamTypes.map(e => this.getExamTypeName(e)).join(', ') || 'No exam types defined';
  }

  getExamTypeName(et: ModuleExam): string {
    return this.translate.currentLang === 'de' ? et.nameDe : et.nameEn;
  }

  getExamTypeShort(et: ModuleExam): string {
    return this.translate.currentLang === 'de' ? et.shortDe : et.shortEn;
  }

  updateModuleSearch(event: Event) { this.moduleSearchFilter.set((event.target as HTMLInputElement).value); }

  getInitials(u: any): string {
    const first = (u.firstName || '').charAt(0);
    const last = (u.lastName || '').charAt(0);
    return (first + last).toUpperCase() || '?';
  }
}
