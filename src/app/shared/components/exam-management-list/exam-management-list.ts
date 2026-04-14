import { Component, OnInit, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LecturerApi } from '../../../features/lecturer/services/lecturer-api';
import { NotificationService } from '../../../core/services/notification.service';
import { GradesService } from '../../../core/services/grades.services';
import { GradeScaleDialog } from '../grade-scale-dialog/grade-scale-dialog';
import {
  LecturerCourseResponse,
  ExamStatus,
  StudentSubmissionResponse,
  SubmissionStatus
} from '../../../features/lecturer/models/lecturer.models';

@Component({
  selector: 'app-exam-management-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './exam-management-list.html',
  styleUrl: './exam-management-list.scss',
})
export class ExamManagementList implements OnInit {
  courses = input<LecturerCourseResponse[]>([]);
  isAdmin = input<boolean>(false);
  isLoadingCourses = input<boolean>(false);
  refresh = output<void>();

  selectedCourse = signal<LecturerCourseResponse | undefined>(undefined);
  submissions = signal<StudentSubmissionResponse[]>([]);
  isLoadingSubmissions = signal(false);
  
  view = signal<'overview' | 'materials' | 'grading'>('overview');
  
  // Management Form State (Signals)
  examFileName = signal('');
  examContent = signal('');
  solutionFileName = signal('');
  solutionContent = signal('');
  lecturerNotes = signal('');
  
  // Track original values
  initialExamFileName = '';
  initialSolutionFileName = '';

  ExamStatus = ExamStatus;
  SubmissionStatus = SubmissionStatus;

  ALLOWED_GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0];

  // Filter state
  searchQuery = signal('');
  filterSubmission = signal<'ALL' | 'YES' | 'NO'>('ALL');
  filterStatus = signal<'ALL' | ExamStatus>('ALL');
  filterExamType = signal('ALL');
  filterLecturer = signal('ALL');
  filterStudyGroup = signal('ALL');
  
  studentSearchQuery = signal('');
  isSaving = signal(false);

  uniqueExamTypes = computed(() => {
    const types = this.courses().map(c => c.examTypeName).filter(t => !!t);
    return Array.from(new Set(types));
  });

  uniqueLecturers = computed(() => {
    const names = this.courses().map(c => c.lecturerName).filter(n => !!n);
    return Array.from(new Set(names)).sort();
  });

  uniqueStudyGroups = computed(() => {
    const groups = this.courses().flatMap(c => c.studyGroupNames);
    return Array.from(new Set(groups)).sort();
  });

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const submissionFilter = this.filterSubmission();
    const stat = this.filterStatus();
    const type = this.filterExamType();
    const lect = this.filterLecturer();
    const group = this.filterStudyGroup();

    return this.courses().filter(course => {
      const matchesSearch = course.moduleName.toLowerCase().includes(query) ||
                            course.studyGroupNames.some(g => g.toLowerCase().includes(query));
      const matchesSubmission = submissionFilter === 'ALL' || 
                               (submissionFilter === 'YES' && course.submission) || 
                               (submissionFilter === 'NO' && !course.submission);
      const matchesStatus = stat === 'ALL' || course.examStatus === stat;
      const matchesExamType = type === 'ALL' || course.examTypeName === type;
      
      const matchesLecturer = lect === 'ALL' || course.lecturerName === lect;
      const matchesStudyGroup = group === 'ALL' || course.studyGroupNames.includes(group);
      
      return matchesSearch && matchesSubmission && matchesStatus && matchesExamType && matchesLecturer && matchesStudyGroup;
    });
  });

  filteredSubmissions = computed(() => {
    const query = this.studentSearchQuery().toLowerCase();
    return this.submissions()
      .filter(s => 
        s.studentName.toLowerCase().includes(query) || 
        s.studentNumber.toLowerCase().includes(query)
      )
      .sort((a, b) => a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true, sensitivity: 'base' }));
  });

  gradedCount = computed(() => {
    return this.submissions().filter(s => !!s.grade).length;
  });

  allStudentsGraded = computed(() => {
    const subs = this.submissions();
    return subs.length > 0 && subs.every(s => !!s.grade);
  });

  constructor(
    private lecturerApi: LecturerApi,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private gradesService: GradesService
  ) {}

  ngOnInit(): void {}

  manageMaterials(course: LecturerCourseResponse) {
    this.selectedCourse.set(course);
    this.view.set('materials');
    this.lecturerNotes.set(course.lecturerNotes || '');
    this.examFileName.set(course.examFileName || '');
    this.initialExamFileName = course.examFileName || '';
    this.examContent.set('');
    this.solutionFileName.set(course.solutionFileName || '');
    this.initialSolutionFileName = course.solutionFileName || '';
    this.solutionContent.set('');
  }

  clearFile(type: 'exam' | 'solution') {
    if (type === 'exam') {
      this.examFileName.set('');
      this.examContent.set('');
    } else {
      this.solutionFileName.set('');
      this.solutionContent.set('');
    }
  }

  downloadFile(type: 'exam' | 'solution') {
    const fileName = type === 'exam' ? this.examFileName() : this.solutionFileName();
    const content = type === 'exam' ? this.examContent() : this.solutionContent();
    
    if (content) {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName;
      link.click();
    } else if (this.selectedCourse()) {
      const docType = type === 'exam' ? 'EXAM_PAPER' : 'SAMPLE_SOLUTION';
      this.lecturerApi.downloadDocument(this.selectedCourse()!.id, docType).subscribe({
        next: (response) => {
          const link = document.createElement('a');
          link.href = response.content;
          link.download = response.fileName;
          link.click();
        },
        error: () => this.notificationService.showError('error.download')
      });
    }
  }

  onFileSelected(event: any, type: 'exam' | 'solution') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'exam') {
        this.examFileName.set(file.name);
      } else {
        this.solutionFileName.set(file.name);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (type === 'exam') {
          this.examContent.set(base64);
        } else {
          this.solutionContent.set(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  submitMaterials() {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;

    this.lecturerApi.uploadExamMaterials(currentCourse.id, {
      examFileName: this.examFileName(),
      examContent: this.examContent(),
      solutionFileName: this.solutionFileName(),
      solutionContent: this.solutionContent(),
      lecturerNotes: this.lecturerNotes()
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('lecturerGrading.examMaterialsSuccess'));
        this.refresh.emit();
        this.view.set('overview');
      },
      error: () => this.notificationService.showError(this.translate.instant('lecturerGrading.examMaterialsError'))
    });
  }

  openGrading(course: LecturerCourseResponse): void {
    this.selectedCourse.set(course);
    this.view.set('grading');
    this.loadSubmissions(course.id);
  }

  loadSubmissions(seriesId: number): void {
    this.isLoadingSubmissions.set(true);
    this.lecturerApi.getSubmissions(seriesId).subscribe({
      next: (submissions) => {
        this.submissions.set(submissions);
        this.isLoadingSubmissions.set(false);
      },
      error: () => {
        this.isLoadingSubmissions.set(false);
      }
    });
  }

  saveSingleGrade(student: StudentSubmissionResponse): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;
    
    this.isSaving.set(true);

    this.lecturerApi.updateSingleGrade(currentCourse.id, {
      studentId: student.studentId,
      grade: student.grade,
      points: student.points,
      feedback: student.feedback || ''
    }).subscribe({
      next: (updatedStudent) => {
        this.submissions.update(list => list.map(s => s.studentId === updatedStudent.studentId ? updatedStudent : s));
        setTimeout(() => this.isSaving.set(false), 500);
      },
      error: () => {
        this.isSaving.set(false);
        this.notificationService.showError(this.translate.instant('lecturerGrading.gradesApplyError'));
      }
    });
  }

  onGradeManualChange(student: StudentSubmissionResponse): void {
    student.points = undefined;
    this.saveSingleGrade(student);
  }

  finalizeGrades(): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;
    
    const grades = this.submissions().map(s => ({
      studentId: s.studentId,
      grade: s.grade || 0,
      points: s.points,
      feedback: s.feedback || ''
    }));

    this.lecturerApi.bulkApplyGrades(currentCourse.id, { grades }).subscribe({
      next: () => {
        this.lecturerApi.publishGrades(currentCourse.id).subscribe({
          next: () => {
            this.notificationService.showSuccess(this.translate.instant('lecturerGrading.finalizeSuccess'));
            this.refresh.emit();
            this.view.set('overview');
          },
          error: () => this.notificationService.showError(this.translate.instant('lecturerGrading.finalizeError'))
        });
      },
      error: () => this.notificationService.showError(this.translate.instant('lecturerGrading.gradesApplyError'))
    });
  }

  backToOverview(): void {
    this.view.set('overview');
    this.selectedCourse.set(undefined);
    this.submissions.set([]);
  }

  downloadStudentSubmission(student: StudentSubmissionResponse): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse || !student.documentUrl) return;

    this.lecturerApi.downloadStudentSubmission(currentCourse.id, student.studentId).subscribe({
      next: (response) => {
        const byteString = window.atob(response.content);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const int8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          int8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([int8Array], { type: response.mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notificationService.showError('error.download')
    });
  }

  isGradingDisabled(course: LecturerCourseResponse): boolean {
    if (course.examStatus === ExamStatus.GRADING || course.examStatus === ExamStatus.COMPLETED) {
      return false;
    }
    return course.submissionCount === 0;
  }

  getKlausurEvent(course: LecturerCourseResponse) {
    return course.events.find(e => e.type === 'KLAUSUR' || e.type === 'LEHRVERANSTALTUNG');
  }

  getStatusColor(status: ExamStatus | SubmissionStatus | string): string {
    switch (status) {
      case ExamStatus.OPEN:
      case SubmissionStatus.PENDING: 
        return 'status-blue';
      case ExamStatus.PROVIDED:
      case ExamStatus.GRADING:
      case SubmissionStatus.SUBMITTED:
        return 'status-purple';
      case ExamStatus.COMPLETED:
      case 'GRADED':
        return 'status-green';
      default: return '';
    }
  }

  isPast(dateString: string | undefined): boolean {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  }
  
  openGradeScale(): void {
    this.gradesService.getGradeScale().subscribe({
      next: (entries) => {
        this.dialog.open(GradeScaleDialog, {
          width: '500px',
          data: { entries: entries }
        });
      },
      error: () => this.notificationService.showError('error.loadData')
    });
  }
}
