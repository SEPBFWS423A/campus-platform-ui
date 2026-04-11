import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  TemplateRef,
  AfterViewInit
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl, FormGroup, FormArray } from '@angular/forms';
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
import {FaqAdminResponse, FaqTranslationModel, FaqUpsertRequest} from '../../../core/models/faqModel';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../core/user/user.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Editor, Toolbar, NgxEditorModule } from 'ngx-editor';
import { ModuleHandbookService } from './module-handbook.service';
import { GenerateHandbookDialog } from './generate-handbook-dialog/generate-handbook-dialog.component';



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
    TranslateModule,
    MatTooltipModule,
    NgxEditorModule
  ],
  templateUrl: './academic-structure.html',
  styleUrls: ['./academic-structure.scss']
})
export class AcademicStructure implements OnInit, OnDestroy, AfterViewInit {
  private adminService = inject(AdminService);
  private handbookService = inject(ModuleHandbookService);
  private userService = inject(UserService);

  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  public translate = inject(TranslateService);
  private sanitizer = inject(DomSanitizer);
  private breakpointObserver = inject(BreakpointObserver);
  isFirstLoad = signal(true);
  sidebarCollapsed = signal(this.breakpointObserver.isMatched('(max-width: 1400px)'));

  ngAfterViewInit() {
    setTimeout(() => this.isFirstLoad.set(false), 150);
  }

  constructor() {
    this.breakpointObserver.observe(['(max-width: 1400px)']).subscribe(result => {
      this.sidebarCollapsed.set(result.matches);
    });
  }

  supportedFaqLanguages = ['de', 'en'];

  // Data signals
  courses = signal<CourseOfStudy[]>([]);
  specializations = signal<Specialization[]>([]);
  modules = signal<Module[]>([]);
  lecturers = signal<User[]>([]);
  universityInfo = signal<InstitutionInfo | null>(null);
  examTypes = signal<ModuleExam[]>([]);
  faqs = signal<FaqAdminResponse[]>([]);

  // View state
  activeView = signal<'structure' | 'modules' | 'university' | 'exam-types' | 'grade-scale' | 'emails' | 'faqs'>('university');
  gradeScaleEntries = signal<any[]>([]);
  isDrawerOpen = signal(false);
  showAddCourseForm = signal(false);
  showAddSpecializationForm = signal(false);
  showAddModuleForm = signal(false);
  showAddExamTypeForm = signal(false);
  showAddFaqForm = signal(false);
  editingFaq = signal<FaqAdminResponse | null>(null);
  showAddGradeScaleForm = signal(false);
  selectedModule = signal<Module | null>(null);
  selectedCourse = signal<CourseOfStudy | null>(null);
  selectedSpecialization = signal<Specialization | null>(null);
  selectedExamType = signal<ModuleExam | null>(null);
  selectedGradeScaleEntry = signal<any | null>(null);

  @ViewChild('courseDialogTemplate') courseDialogTemplate!: TemplateRef<any>;
  @ViewChild('specializationDialogTemplate') specializationDialogTemplate!: TemplateRef<any>;
  @ViewChild('examTypeDialogTemplate') examTypeDialogTemplate!: TemplateRef<any>;
  @ViewChild('moduleDialogTemplate') moduleDialogTemplate!: TemplateRef<any>;
  @ViewChild('gradeScaleDialogTemplate') gradeScaleDialogTemplate!: TemplateRef<any>;
  @ViewChild('faqDialogTemplate') faqDialogTemplate!: TemplateRef<any>;

  isEditingCourse = computed(() => !!this.selectedCourse());
  isEditingSpecialization = computed(() => !!this.selectedSpecialization());
  isEditingExamType = computed(() => !!this.selectedExamType());
  isEditingModule = computed(() => !!this.selectedModule());

  selectedPossibleExamTypes = signal<ModuleExam[]>([]);

  // Filters
  moduleSearchFilter = signal('');
  moduleCourseNameFilter = signal<string | ''>('');
  moduleDegreeFilter = signal<DegreeType | ''>('');
  moduleSpecializationFilter = signal<string | ''>('');
  moduleSemesterFilter = signal<number | ''>('');

  faqSearchFilter = signal('');
  faqCategoryFilter = signal<string>('all');
  faqStatusFilter = signal<'all' | 'published' | 'draft'>('all');

  // Editors
  editorInvitationDe!: Editor;
  editorInvitationEn!: Editor;
  editorResetDe!: Editor;
  editorResetEn!: Editor;

  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  floatingToolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['link'],
  ];

  // Degree Types
  degreeTypes = Object.values(DegreeType);

  selectedCourseIdForModule = signal<string>('');

  // Forms
  courseForm = this.fb.group({
    name: ['', Validators.required],
    degreeType: [DegreeType.Bachelor, Validators.required]
  });

  specializationForm = this.fb.group({
    name: ['', Validators.required],
    courseId: ['', Validators.required]
  });

  moduleForm = this.fb.group({
    name: ['', Validators.required],
    semester: [1, [Validators.required, Validators.min(1)]],
    requiredTotalHours: [40, [Validators.required, Validators.min(0)]],
    possibleExamTypes: [[] as ModuleExam[], Validators.required],
    preferredExamTypeId: [undefined as string | undefined],
    lecturers: [[] as ModuleLecturer[], Validators.required],
    courseOfStudyId: ['', Validators.required],
    specializationId: ['']
  });

  faqForm = this.fb.group({
    sortOrder: [0, Validators.required],
    published: [true],
    translations: this.fb.array([])
  });

  examTypeForm = this.fb.group({
    type: ['', Validators.required],
    submission: [false, Validators.required],
    nameDe: ['', Validators.required],
    nameEn: ['', Validators.required],
    shortDe: ['', Validators.required],
    shortEn: ['', Validators.required]
  });

  gradeScaleForm = this.fb.group({
    grade: [null as number | null, [Validators.required, Validators.min(1.0), Validators.max(5.0)]],
    minimumPoints: [null as number | null, [Validators.required, Validators.min(0), Validators.max(500)]],
    label: ['']
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
    impressum: ['', Validators.required],
    invitationEmailSubjectDe: [''],
    invitationEmailBodyDe: [''],
    invitationEmailSubjectEn: [''],
    invitationEmailBodyEn: [''],
    passwordResetEmailSubjectDe: [''],
    passwordResetEmailBodyDe: [''],
    passwordResetEmailSubjectEn: [''],
    passwordResetEmailBodyEn: ['']
  });

  // Computed
  semesters = computed(() =>
    Array.from(new Set(this.modules().map(m => m.semester))).sort((a, b) => a - b)
  );

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
    const courseId = this.selectedCourseIdForModule();
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

  availableFaqCategories = computed(() => {
    const categories = this.faqs()
      .map(faq => this.getFaqDisplayTranslation(faq)?.category?.trim())
      .filter((category): category is string => !!category);

    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b));
  });

  filteredAdminFaqs = computed(() => {
    const search = this.faqSearchFilter().toLowerCase().trim();
    const categoryFilter = this.faqCategoryFilter();
    const statusFilter = this.faqStatusFilter();

    return this.faqs().filter(faq => {
      const translation = this.getFaqDisplayTranslation(faq);

      const question = translation?.question?.toLowerCase() ?? '';
      const answer = translation?.answer?.toLowerCase() ?? '';
      const category = translation?.category ?? '';
      const categoryLower = category.toLowerCase();

      const matchesSearch =
        !search ||
        question.includes(search) ||
        answer.includes(search) ||
        categoryLower.includes(search);

      const matchesCategory =
        categoryFilter === 'all' || category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && faq.published) ||
        (statusFilter === 'draft' && !faq.published);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  });

  get courseNameFormControl() {
    return this.courseForm.get('name') as FormControl;
  }

  get specializationNameFormControl() {
    return this.specializationForm.get('name') as FormControl;
  }

  get faqTranslations(): FormArray<FormGroup> {
    return this.faqForm.get('translations') as FormArray<FormGroup>;
  }

  ngOnInit() {
    const editorConfig = {
      linkValidationPattern: '^(https?://.*|{url})'
    };
    this.editorInvitationDe = new Editor(editorConfig);
    this.editorInvitationEn = new Editor(editorConfig);
    this.editorResetDe = new Editor(editorConfig);
    this.editorResetEn = new Editor(editorConfig);

    this.loadData();
    this.resetFaqForm();

    this.moduleForm.get('possibleExamTypes')?.valueChanges.subscribe(val => {
      const selected = val || [];
      this.selectedPossibleExamTypes.set(selected);

      const preferredId = this.moduleForm.get('preferredExamTypeId')?.value;
      if (preferredId && !selected.some(et => et.id === preferredId)) {
        this.moduleForm.get('preferredExamTypeId')?.setValue(undefined);
      }
    });

    this.moduleForm.get('courseOfStudyId')?.valueChanges.subscribe(id => {
      this.selectedCourseIdForModule.set(id || '');
      this.moduleForm.get('specializationId')?.setValue('');
    });
  }

  ngOnDestroy(): void {
    this.editorInvitationDe.destroy();
    this.editorInvitationEn.destroy();
    this.editorResetDe.destroy();
    this.editorResetEn.destroy();
  }

  loadData() {
    this.adminService.getCourses().subscribe(c => this.courses.set(c));
    this.adminService.getSpecializations().subscribe(s => this.specializations.set(s));
    this.adminService.getModules().subscribe(m => this.modules.set(m));
    this.adminService.getUsers().subscribe(u => {
      this.lecturers.set(u.filter(user => user.role === UserRole.Lecturer));
    });
    this.userService.getInstitutionInfo().subscribe(info => {
      this.universityInfo.set(info);
      this.universityForm.patchValue(info);
    });
    this.adminService.getExamTypes().subscribe(et => this.examTypes.set(et));
    this.adminService.getFaqs().subscribe(f => this.faqs.set(f));
    this.adminService.getGradeScale().subscribe(gs => this.gradeScaleEntries.set(gs));
  }

  switchView(view: 'structure' | 'modules' | 'university' | 'exam-types' | 'grade-scale' | 'emails' | 'faqs') {
    this.activeView.set(view);
    this.isDrawerOpen.set(false);
  }

  // --- University CRUD ---
  saveUniversityInfo() {
    if (this.universityForm.invalid) return;

    const info = this.universityForm.value as InstitutionInfo;
    this.adminService.updateInstitutionInfo(info).subscribe(res => {
      this.universityInfo.set(res);
      const msg = this.activeView() === 'emails'
        ? 'academicStructure.updateEmailTemplatesSuccess'
        : 'academicStructure.updateUniversityInfoSuccess';
      this.notificationService.showSuccess(msg);
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.showSuccess('academicStructure.copiedToClipboard');
    });
  }

  // --- Course CRUD ---
  openAddCourse() {
    this.selectedCourse.set(null);
    this.courseForm.reset({ degreeType: DegreeType.Bachelor });
    this.dialog.open(this.courseDialogTemplate, { width: '500px', disableClose: true });
  }

  editCourse(course: CourseOfStudy) {
    this.selectedCourse.set(course);
    this.courseForm.patchValue({
      name: course.name,
      degreeType: course.degreeType
    });
    this.dialog.open(this.courseDialogTemplate, { width: '500px', disableClose: true });
  }

  addCourse() {
    if (this.courseForm.invalid) return;
    const value = this.courseForm.value as any;
    const editingId = this.selectedCourse()?.id;

    if (editingId) {
      this.adminService.updateCourse(editingId, value).subscribe(c => {
        this.courses.update(list => list.map(item => item.id === editingId ? c : item));
        this.cancelCourseEdit();
        this.notificationService.showSuccess('academicStructure.updateCourseSuccess');
      });
    } else {
      this.adminService.createCourse(value).subscribe(c => {
        this.courses.update(list => [...list, c]);
        this.cancelCourseEdit();
        this.notificationService.showSuccess('academicStructure.addCourseSuccess');
      });
    }
  }

  cancelCourseEdit() {
    this.selectedCourse.set(null);
    this.courseForm.reset({ degreeType: DegreeType.Bachelor });
    this.showAddCourseForm.set(false);
    this.dialog.closeAll();
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
  openAddSpecialization(courseId: string) {
    this.selectedSpecialization.set(null);
    this.specializationForm.reset({ courseId });
    this.dialog.open(this.specializationDialogTemplate, { width: '400px', disableClose: true });
  }

  editSpecialization(spec: Specialization) {
    this.selectedSpecialization.set(spec);
    this.specializationForm.patchValue({
      name: spec.name,
      courseId: spec.courseId
    });
    this.dialog.open(this.specializationDialogTemplate, { width: '400px', disableClose: true });
  }

  addSpecialization() {
    if (this.specializationForm.invalid) return;
    const value = this.specializationForm.value as any;
    const editingId = this.selectedSpecialization()?.id;

    if (editingId) {
      this.adminService.updateSpecialization(editingId, value).subscribe(s => {
        this.specializations.update(list => list.map(item => item.id === editingId ? s : item));
        this.cancelSpecializationEdit();
        this.notificationService.showSuccess('academicStructure.updateSpecializationSuccess');
      });
    } else {
      this.adminService.createSpecialization(value).subscribe(s => {
        this.specializations.update(list => [...list, s]);
        this.cancelSpecializationEdit();
        this.notificationService.showSuccess('academicStructure.addSpecializationSuccess');
      });
    }
  }

  cancelSpecializationEdit() {
    this.selectedSpecialization.set(null);
    this.specializationForm.reset();
    this.showAddSpecializationForm.set(false);
    this.dialog.closeAll();
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
  openAddModule() {
    this.selectedModule.set(null);
    this.moduleForm.reset({ semester: 1, requiredTotalHours: 40 });
    this.dialog.open(this.moduleDialogTemplate, { width: '800px', disableClose: true });
  }

  editModule(module: Module) {
    this.selectedModule.set(module);
    this.moduleForm.patchValue({
      name: module.name,
      semester: module.semester,
      requiredTotalHours: module.requiredTotalHours,
      possibleExamTypes: module.possibleExamTypes,
      preferredExamTypeId: module.preferredExamTypeId,
      lecturers: module.lecturers as any,
      courseOfStudyId: module.courseOfStudyId,
      specializationId: module.specializationId
    });
    this.dialog.open(this.moduleDialogTemplate, { width: '800px', disableClose: true });
  }

  addModule() {
    if (this.moduleForm.invalid) return;

    const formValue = this.moduleForm.value;
    const editingId = this.selectedModule()?.id;

    const modulePayload = {
      ...formValue,
      examTypeIds: formValue.possibleExamTypes?.map(et => (et as any).id),
      preferredExamTypeId: formValue.preferredExamTypeId,
      lecturerIds: formValue.lecturers?.map(l => (l as any).id)
    };

    if (editingId) {
      this.adminService.updateModule(editingId, modulePayload as any).subscribe({
        next: () => {
          this.adminService.getModules().subscribe(m => this.modules.set(m));
          this.cancelModuleEdit();
          this.notificationService.showSuccess('academicStructure.updateModuleSuccess');
        },
        error: () => this.notificationService.showError('common.error')
      });
    } else {
      this.adminService.createModule(modulePayload as any).subscribe({
        next: () => {
          this.adminService.getModules().subscribe(m => this.modules.set(m));
          this.cancelModuleEdit();
          this.notificationService.showSuccess('academicStructure.addModuleSuccess');
        },
        error: () => this.notificationService.showError('common.error')
      });
    }
  }

  cancelModuleEdit() {
    this.selectedModule.set(null);
    this.moduleForm.reset({ semester: 1, requiredTotalHours: 40 });
    this.selectedCourseIdForModule.set('');
    this.showAddModuleForm.set(false);
    this.dialog.closeAll();
  }

  compareExamTypes(a: any, b: any): boolean {
    return a && b ? a.id === b.id : a === b;
  }

  compareLecturers(a: any, b: any): boolean {
    return a && b ? a.id === b.id : a === b;
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
  openAddExamType() {
    this.selectedExamType.set(null);
    this.examTypeForm.reset();
    this.dialog.open(this.examTypeDialogTemplate, { width: '500px', disableClose: true });
  }

  editExamType(et: ModuleExam) {
    this.selectedExamType.set(et);
    this.examTypeForm.patchValue({
      type: et.type,
      submission: et.submission,
      nameDe: et.nameDe,
      nameEn: et.nameEn,
      shortDe: et.shortDe,
      shortEn: et.shortEn
    });
    this.dialog.open(this.examTypeDialogTemplate, { width: '500px', disableClose: true });
  }

  addExamType() {
    if (this.examTypeForm.invalid) return;
    const value = this.examTypeForm.value as any;
    const editingId = this.selectedExamType()?.id;

    if (editingId) {
      this.adminService.updateExamType(editingId, value).subscribe(et => {
        this.examTypes.update(list => list.map(item => item.id === editingId ? et : item));
        this.cancelExamTypeEdit();
        this.notificationService.showSuccess('academicStructure.updateExamTypeSuccess');
      });
    } else {
      this.adminService.createExamType(value).subscribe(et => {
        this.examTypes.update(list => [...list, et]);
        this.cancelExamTypeEdit();
        this.notificationService.showSuccess('academicStructure.addExamTypeSuccess');
      });
    }
  }

  cancelExamTypeEdit() {
    this.selectedExamType.set(null);
    this.examTypeForm.reset();
    this.showAddExamTypeForm.set(false);
    this.dialog.closeAll();
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
          this.notificationService.showSuccess('academicStructure.deleteExamTypeSuccess');
        });
      }
    });
  }

  // --- FAQ CRUD ---
  openFaqForm() {
    this.editingFaq.set(null);
    this.resetFaqForm();
    this.showAddFaqForm.set(true);

    this.dialog.open(this.faqDialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true
    });
  }

  addFaq() {
    if (this.faqForm.invalid) return;

    const payload = this.toFaqPayload();

    this.adminService.createFaq(payload).subscribe({
      next: faq => {
        this.faqs.update(list => [...list, faq].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
        this.cancelFaqEdit();
        this.notificationService.showSuccess('academicStructure.addFaqSuccess');
      },
      error: () => this.notificationService.showError('academicStructure.addFaqError')
    });
  }

  startEditFaq(faq: FaqAdminResponse) {
    this.editingFaq.set(faq);
    this.showAddFaqForm.set(true);
    this.patchFaqForm(faq);

    this.dialog.open(this.faqDialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true
    });
  }

  saveFaqEdit() {
    const editing = this.editingFaq();
    if (!editing || this.faqForm.invalid) return;

    const payload = this.toFaqPayload();

    this.adminService.updateFaq(editing.id, payload).subscribe({
      next: updatedFaq => {
        this.faqs.update(list =>
          list
            .map(f => (f.id === updatedFaq.id ? updatedFaq : f))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        );
        this.cancelFaqEdit();
        this.notificationService.showSuccess('academicStructure.updateFaqSuccess');
      },
      error: () => this.notificationService.showError('academicStructure.updateFaqError')
    });
  }

  deleteFaq(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteFaqTitle',
        message: 'academicStructure.deleteFaqMessage'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteFaq(id).subscribe({
          next: () => {
            this.faqs.update(list => list.filter(f => f.id !== id));
            this.notificationService.showSuccess('academicStructure.deleteFaqSuccess');
          },
          error: () => this.notificationService.showError('academicStructure.deleteFaqError')
        });
      }
    });
  }

  cancelFaqEdit() {
    this.editingFaq.set(null);
    this.showAddFaqForm.set(false);
    this.resetFaqForm();
    this.dialog.closeAll();
  }

  addFaqTranslation(languageCode: string = '') {
    this.faqTranslations.push(this.createFaqTranslationGroup(languageCode));
  }

  removeFaqTranslation(index: number) {
    if (this.faqTranslations.length <= 1) return;
    this.faqTranslations.removeAt(index);
  }

  private createFaqTranslationGroup(languageCode: string, data?: Partial<FaqTranslationModel>): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      languageCode: [data?.languageCode ?? languageCode, [Validators.required]],
      question: [data?.question ?? '', [Validators.required, Validators.maxLength(255)]],
      answer: [data?.answer ?? '', [Validators.required]],
      category: [data?.category ?? '', [Validators.required, Validators.maxLength(100)]]
    });
  }

  private resetFaqForm() {
    this.faqForm.reset({
      sortOrder: this.getNextFaqSortOrder(),
      published: true
    });

    this.faqTranslations.clear();

    for (const lang of this.supportedFaqLanguages) {
      this.faqTranslations.push(this.createFaqTranslationGroup(lang));
    }
  }

  private patchFaqForm(faq: FaqAdminResponse) {
    this.faqForm.patchValue({
      sortOrder: faq.sortOrder,
      published: faq.published
    });

    this.faqTranslations.clear();

    for (const translation of faq.translations) {
      this.faqTranslations.push(this.createFaqTranslationGroup(translation.languageCode, translation));
    }
  }

  private toFaqPayload(): FaqUpsertRequest {
    const raw = this.faqForm.getRawValue();

    return {
      sortOrder: raw.sortOrder ?? 0,
      published: raw.published ?? true,
      translations: (raw.translations ?? []).map((t: any) => ({
        id: t["id"] ?? undefined,
        languageCode: (t["languageCode"] ?? '').trim().toLowerCase(),
        question: (t["question"] ?? '').trim(),
        answer: (t["answer"] ?? '').trim(),
        category: (t["category"] ?? '').trim()
      }))
    };
  }

  getNextFaqSortOrder(): number {
    const currentFaqs = this.faqs();
    if (currentFaqs.length === 0) return 1;
    return Math.max(...currentFaqs.map(f => f.sortOrder)) + 1;
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
    return this.translate.getCurrentLang() === 'de' ? et.nameDe : et.nameEn;
  }

  getExamTypeShort(et: ModuleExam): string {
    return this.translate.getCurrentLang() === 'de' ? et.shortDe : et.shortEn;
  }

  private getCurrentUiLanguage(): string {
    return (this.translate.getCurrentLang() || this.translate.getFallbackLang() || 'de')
      .toLowerCase()
      .trim();
  }

  getFaqDisplayTranslation(faq: FaqAdminResponse): FaqTranslationModel | undefined {
    const currentLang = this.getCurrentUiLanguage();

    return (
      faq.translations.find(t => t.languageCode?.toLowerCase() === currentLang) ??
      faq.translations.find(t => t.languageCode?.toLowerCase() === 'de') ??
      faq.translations[0]
    );
  }

  updateFaqSearch(event: Event) {
    this.faqSearchFilter.set((event.target as HTMLInputElement).value);
  }

  // --- Grade Scale CRUD ---
  openAddGradeScale() {
    this.selectedGradeScaleEntry.set(null);
    this.gradeScaleForm.reset();
    this.dialog.open(this.gradeScaleDialogTemplate, { width: '400px', disableClose: true });
  }

  editGradeScaleEntry(entry: any) {
    this.selectedGradeScaleEntry.set(entry);
    this.gradeScaleForm.patchValue({
      grade: entry.grade,
      minimumPoints: entry.minimumPoints,
      label: entry.label
    });
    this.dialog.open(this.gradeScaleDialogTemplate, { width: '400px', disableClose: true });
  }

  saveGradeScaleEntry() {
    if (this.gradeScaleForm.invalid) return;
    const value = this.gradeScaleForm.value as any;
    const editingId = this.selectedGradeScaleEntry()?.id;
    if (editingId) value.id = editingId;

    this.adminService.saveGradeScaleEntry(value).subscribe(entry => {
      if (editingId) {
        this.gradeScaleEntries.update(list => list.map(item => item.id === editingId ? entry : item).sort((a,b) => b.minimumPoints - a.minimumPoints));
      } else {
        this.gradeScaleEntries.update(list => [...list, entry].sort((a,b) => b.minimumPoints - a.minimumPoints));
      }
      this.cancelGradeScaleEdit();
      this.notificationService.showSuccess('academicStructure.saveGradeScaleSuccess');
    });
  }

  cancelGradeScaleEdit() {
    this.selectedGradeScaleEntry.set(null);
    this.gradeScaleForm.reset();
    this.dialog.closeAll();
  }

  deleteGradeScaleEntry(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'academicStructure.deleteGradeScaleTitle',
        message: 'academicStructure.deleteGradeScaleMessage'
      }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.deleteGradeScaleEntry(id).subscribe(() => {
          this.gradeScaleEntries.update(list => list.filter(item => item.id !== id));
          this.notificationService.showSuccess('academicStructure.deleteGradeScaleSuccess');
        });
      }
    });
  }

  updateModuleSearch(event: Event) { this.moduleSearchFilter.set((event.target as HTMLInputElement).value); }

  getInitials(u: any): string {
    const first = (u.firstName || '').charAt(0);
    const last = (u.lastName || '').charAt(0);
    return (first + last).toUpperCase() || '?';
  }

  generateHandbook() {
    const dialogRef = this.dialog.open(GenerateHandbookDialog, {
      width: '450px',
      data: {
        courses: this.courses(),
        modules: this.modules()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { course, degree, language } = result;

        const courseModules = this.modules().filter(m => m.courseOfStudyId === course.id);
        if (courseModules.length === 0) {
          this.notificationService.showInfo('academicStructure.noModulesForHandbook');
          return;
        }

        const generationResult = this.handbookService.generateHandbook(
          course,
          courseModules,
          this.universityInfo(),
          this.specializations(),
          this.examTypes(),
          language
        );

        const url = URL.createObjectURL(generationResult.blob);
        window.open(url, '_blank');

        const link = document.createElement('a');
        link.href = url;
        link.download = generationResult.filename;
        link.click();

        this.notificationService.showSuccess('academicStructure.handbookGenerated');
      }
    });
  }

}


