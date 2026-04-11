import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LecturerApi } from '../services/lecturer-api';
import { NotificationService } from '../../../core/services/notification.service';
import {
  LecturerCourseResponse,
  ExamStatus,
  ExamCategory,
  StudentSubmissionResponse,
  SubmissionStatus
} from '../models/lecturer.models';

@Component({
  selector: 'app-grading',
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
    TranslateModule
  ],
  templateUrl: './grading.html',
  styleUrl: './grading.scss',
})
export class Grading implements OnInit {
  courses = signal<LecturerCourseResponse[]>([]);
  selectedCourse = signal<LecturerCourseResponse | undefined>(undefined);
  submissions = signal<StudentSubmissionResponse[]>([]);
  isLoadingSubmissions = signal(false);
  isLoadingCourses = signal(false);
  
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
  ExamCategory = ExamCategory;
  SubmissionStatus = SubmissionStatus;

  ALLOWED_GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0];

  // Filter state
  searchQuery = signal('');
  filterCategory = signal<'ALL' | ExamCategory>('ALL');
  filterStatus = signal<'ALL' | ExamStatus>('ALL');
  filterExamType = signal('ALL');
  
  studentSearchQuery = signal('');
  isSaving = signal(false);

  uniqueExamTypes = computed(() => {
    const types = this.courses().map(c => c.examTypeName).filter(t => !!t);
    return Array.from(new Set(types));
  });

  filteredCourses = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const cat = this.filterCategory();
    const stat = this.filterStatus();
    const type = this.filterExamType();

    return this.courses().filter(course => {
      const matchesSearch = course.moduleName.toLowerCase().includes(query) ||
                            course.studyGroupNames.some(g => g.toLowerCase().includes(query));
      const matchesCategory = cat === 'ALL' || course.examCategory === cat;
      const matchesStatus = stat === 'ALL' || course.examStatus === stat;
      const matchesExamType = type === 'ALL' || course.examTypeName === type;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesExamType;
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

  constructor(
    private lecturerApi: LecturerApi,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoadingCourses.set(true);
    this.lecturerApi.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.isLoadingCourses.set(false);
      },
      error: () => {
        this.isLoadingCourses.set(false);
      }
    });
  }

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
    
    // If it's a new upload (base64) - currently available in session
    if (content) {
      const link = document.createElement('a');
      link.href = content;
      link.download = fileName;
      link.click();
    } else if (this.selectedCourse()) {
      // It's an existing file on the server - fetch it
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
      // Update filename immediately for better UI responsiveness
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
        this.loadCourses();
        this.view.set('overview');
      },
      error: () => this.notificationService.showError(this.translate.instant('lecturerGrading.examMaterialsError'))
    });
  }

  openGrading(course: LecturerCourseResponse): void {
    console.log('[Grading] Opening grading view for course:', course.id, course.moduleName);
    this.selectedCourse.set(course);
    this.view.set('grading');
    this.loadSubmissions(course.id);
  }

  loadSubmissions(seriesId: number): void {
    console.log('[Grading] Triggering loadSubmissions for seriesId:', seriesId);
    this.isLoadingSubmissions.set(true);
    this.lecturerApi.getSubmissions(seriesId).subscribe({
      next: (submissions) => {
        console.log('[Grading] Successfully loaded submissions. Count:', submissions.length);
        this.submissions.set(submissions);
        this.isLoadingSubmissions.set(false);
      },
      error: (err) => {
        console.error('[Grading] Failed to load submissions:', err);
        this.isLoadingSubmissions.set(false);
      }
    });
  }

  saveSingleGrade(student: StudentSubmissionResponse): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;
    
    this.isSaving.set(true);
    console.log('[Grading] Auto-saving single grade for student:', student.studentId);

    this.lecturerApi.updateSingleGrade(currentCourse.id, {
      studentId: student.studentId,
      grade: student.grade,
      points: student.points,
      feedback: student.feedback || ''
    }).subscribe({
      next: (updatedStudent) => {
        // Update the local state with the backend-calculated values (e.g. grade resolved from points)
        this.submissions.update(list => list.map(s => s.studentId === updatedStudent.studentId ? updatedStudent : s));
        setTimeout(() => this.isSaving.set(false), 500);
        console.log('[Grading] Single auto-save successful. Updated grade:', updatedStudent.grade);
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

  saveGradesProgress(): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;
    
    this.isSaving.set(true);
    console.log('[Grading] Force-saving all grades for series:', currentCourse.id);
    const grades = this.submissions().map(s => ({
      studentId: s.studentId,
      grade: s.grade || 0,
      feedback: s.feedback || ''
    }));

    this.lecturerApi.bulkApplyGrades(currentCourse.id, { grades }).subscribe({
      next: () => {
        setTimeout(() => this.isSaving.set(false), 500);
      },
      error: () => {
        this.isSaving.set(false);
        this.notificationService.showError(this.translate.instant('lecturerGrading.gradesApplyError'));
      }
    });
  }

  finalizeGrades(): void {
    const currentCourse = this.selectedCourse();
    if (!currentCourse) return;
    
    // First save the current state
    const grades = this.submissions().map(s => ({
      studentId: s.studentId,
      grade: s.grade || 0,
      feedback: s.feedback || ''
    }));

    this.lecturerApi.bulkApplyGrades(currentCourse.id, { grades }).subscribe({
      next: () => {
        // Then publish
        this.lecturerApi.publishGrades(currentCourse.id).subscribe({
          next: () => {
            this.notificationService.showSuccess(this.translate.instant('lecturerGrading.finalizeSuccess'));
            this.loadCourses();
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
    // Always allowed if already in grading or completed status
    if (course.examStatus === ExamStatus.GRADING || course.examStatus === ExamStatus.COMPLETED) {
      return false;
    }
    // Also allowed if there is at least one submission (for SUBMISSION type exams)
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
      case 'GRADED': // Handle string literal if enum from backend is stringified
        return 'status-green';
      default: return '';
    }
  }
}
