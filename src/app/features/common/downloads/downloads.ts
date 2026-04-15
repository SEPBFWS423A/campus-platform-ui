import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../services/document.service';
import { GeneralDocument } from '../../../core/models/general-document';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../core/user/user.service';
import { UserRole } from '../../../core/models/user-role';
import { LecturerApi } from '../../lecturer/services/lecturer-api';
import { LecturerCourseResponse, CourseDocumentResponse, CourseDocumentRequest } from '../../lecturer/models/lecturer.models';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StudentApi } from '../../student/services/student-api';

export type SidebarItemType = 'general' | 'student_upload' | 'course' | 'lecture_material' | 'script' | 'exercise';

export interface SidebarItem {
  id: string | number;
  type: SidebarItemType;
  label: string;
  icon: string;
  count?: number;
}

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './downloads.html',
  styleUrl: './downloads.scss',
  providers: [DatePipe, DecimalPipe]
})
export class Downloads implements OnInit {
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);
  private lecturerApi = inject(LecturerApi);
  private studentApi = inject(StudentApi);
  private fb = inject(FormBuilder);

  // User State
  isLecturer = signal(false);

  // Sidebar State
  sidebarItems = signal<SidebarItem[]>([]);
  activeSidebarItemId = signal<string | number>('general');

  // General Documents
  generalDocuments = signal<GeneralDocument[]>([]);
  
  // Specific Course Data
  courses = signal<LecturerCourseResponse[]>([]);
  selectedCourseDocs = signal<CourseDocumentResponse[]>([]);

  // Form State
  uploadForm: FormGroup;
  selectedFile: File | null = null;

  // Loading States
  isLoadingDocs = signal(true);
  isUploading = signal(false);

  // Derived State
  activeDocuments = computed(() => {
    const activeId = this.activeSidebarItemId();
    const item = this.sidebarItems().find(i => i.id === activeId);
    if (item?.type === 'course') {
      return this.selectedCourseDocs();
    }
    return this.generalDocuments();
  });

  constructor() {
    this.uploadForm = this.fb.group({
      displayName: ['', Validators.required],
      file: [null as File | null, Validators.required]
    });
  }

  ngOnInit(): void {
    const profile = this.userService.profile();
    this.isLecturer.set(profile?.role === UserRole.Lecturer);
    
    this.initSidebar();
    this.loadGeneralDocuments();
    if (!this.isLecturer()) {
      this.loadCourses();
    }
  }

  initSidebar() {
    const items: SidebarItem[] = [
      { id: 'general', type: 'general', label: 'Allgemeine Dokumente', icon: 'folder', count: 0 },
      { id: 'lecture_material', type: 'lecture_material', label: 'Vorlesungsreihen', icon: 'library_books', count: 0 },
      { id: 'script', type: 'script', label: 'Skripte', icon: 'history_edu', count: 0 },
      { id: 'exercise', type: 'exercise', label: 'Übungsaufgaben', icon: 'assignment', count: 0 },
      { id: 'student_upload', type: 'student_upload', label: 'Studenten-Uploads', icon: 'inbox', count: 0 }
    ];
    this.sidebarItems.set(items);
  }

  updateSidebarCounts() {
    this.sidebarItems.update(items => {
      return items.map(item => {
        // Only update counts for the currently ACTIVE list to prevent cross-contamination
        const activeId = this.activeSidebarItemId();
        if (item.id === activeId) {
          const currentCount = (item.type === 'course') 
            ? this.selectedCourseDocs().length 
            : this.generalDocuments().length;
          return { ...item, count: currentCount };
        }
        return item;
      });
    });
  }

  loadGeneralDocuments(): void {
    const activeItem = this.sidebarItems().find(i => i.id === this.activeSidebarItemId());
    let category = 'GENERAL';
    
    if (activeItem?.type === 'student_upload') category = 'STUDENT_UPLOAD';
    else if (activeItem?.type === 'lecture_material') category = 'LECTURE_MATERIAL';
    else if (activeItem?.type === 'script') category = 'SCRIPT';
    else if (activeItem?.type === 'exercise') category = 'EXERCISE';

    this.isLoadingDocs.set(true);
    this.documentService.adminGetDocuments(category).subscribe({
      next: (docs) => {
        this.generalDocuments.set(docs);
        this.updateSidebarCounts();
        this.isLoadingDocs.set(false);
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.isLoadingDocs.set(false);
        this.showError('documentManagement.noDocuments');
      }
    });
  }

  loadCourses() {
    // Only students see courses on this page now
    this.studentApi.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        const courseItems: SidebarItem[] = courses.map(c => ({
          id: c.id,
          type: 'course',
          label: c.moduleName,
          icon: 'description'
        }));
        
        this.sidebarItems.update(current => {
           const filtered = current.filter(i => i.type !== 'course');
           return [...filtered, ...courseItems];
        });
      },
      error: () => {
        console.error('Failed to load courses for sidebar');
      }
    });
  }

  selectSidebarItem(item: SidebarItem) {
    this.activeSidebarItemId.set(item.id);
    if (item.type === 'course') {
      this.loadCourseDocs(item.id as number);
    } else {
      this.loadGeneralDocuments();
    }
  }

  loadCourseDocs(courseId: number) {
    this.isLoadingDocs.set(true);
    const api = this.isLecturer() ? this.lecturerApi.getCourseDocuments(courseId) : this.studentApi.getCourseDocuments(courseId);

    api.subscribe({
      next: (docs) => {
        this.selectedCourseDocs.set(docs);
        this.isLoadingDocs.set(false);
        
        this.sidebarItems.update(items => items.map(i => 
          i.id === courseId ? { ...i, count: docs.length } : i
        ));
      },
      error: () => {
        this.isLoadingDocs.set(false);
        this.showError('studentSubmissionPage.messages.loadDetailError');
      }
    });
  }

  getActiveLabel(): string {
    const active = this.sidebarItems().find(i => i.id === this.activeSidebarItemId());
    return active ? active.label : 'Dokumente';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
      if (!this.uploadForm.get('displayName')?.value) {
        this.uploadForm.patchValue({ displayName: file.name });
      }
    }
    event.target.value = '';
  }

  onUpload() {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading.set(true);
    const activeItem = this.sidebarItems().find(i => i.id === this.activeSidebarItemId());
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      const payload: any = {
        displayName: this.uploadForm.value.displayName!,
        fileName: this.selectedFile!.name,
        mimeType: this.selectedFile!.type || 'application/octet-stream',
        fileSize: this.selectedFile!.size,
        contentBase64: base64String,
        category: 'GENERAL'
      };

      if (!activeItem) return;

      if (activeItem.type === 'lecture_material') payload.category = 'LECTURE_MATERIAL';
      else if (activeItem.type === 'script') payload.category = 'SCRIPT';
      else if (activeItem.type === 'exercise') payload.category = 'EXERCISE';
      else if (activeItem.type === 'student_upload') payload.category = 'STUDENT_UPLOAD';

      if (activeItem.type === 'course') {
        const courseId = activeItem.id as number;
        const api = this.isLecturer() 
          ? this.lecturerApi.uploadCourseDocument(courseId, payload)
          : this.studentApi.uploadCourseDocument(courseId, payload);
        
        api.subscribe({
          next: () => this.handleUploadSuccess(courseId),
          error: () => this.handleUploadError()
        });
      } else {
        // All other types (general, script, etc.) use the general document service
        this.documentService.uploadDocument(payload).subscribe({
          next: () => this.handleUploadSuccess(),
          error: () => this.handleUploadError()
        });
      }
    };
    reader.readAsDataURL(this.selectedFile);
  }

  private handleUploadSuccess(courseId?: number) {
    this.isUploading.set(false);
    this.uploadForm.reset();
    this.selectedFile = null;
    this.snackBar.open('Dokument erfolgreich hochgeladen', 'OK', { duration: 3000 });
    if (courseId) {
      this.loadCourseDocs(courseId);
    } else {
      this.loadGeneralDocuments();
    }
  }

  private handleUploadError() {
    this.isUploading.set(false);
    this.showError('documentManagement.uploadError');
  }

  onDelete(docId: number, name: string) {
    if (!confirm(`Soll das Dokument '${name}' gelöscht werden?`)) return;
    
    const activeItem = this.sidebarItems().find(i => i.id === this.activeSidebarItemId());

    if (!activeItem || activeItem.type === 'general') {
      this.documentService.deleteDocument(docId).subscribe({
        next: () => {
          this.snackBar.open('Dokument gelöscht', 'OK', { duration: 3000 });
          this.loadGeneralDocuments();
        },
        error: () => this.showError('documentManagement.deleteError')
      });
    } else {
      const courseId = activeItem.id as number;
      const api = this.isLecturer()
        ? this.lecturerApi.deleteCourseDocument(courseId, docId)
        : this.studentApi.deleteCourseDocument(courseId, docId);

      api.subscribe({
        next: () => {
          this.snackBar.open('Dokument gelöscht', 'OK', { duration: 3000 });
          this.loadCourseDocs(courseId);
        },
        error: () => this.showError('Fehler beim Löschen')
      });
    }
  }

  onDownload(docId: number, fileName: string): void {
    const activeItem = this.sidebarItems().find(i => i.id === this.activeSidebarItemId());

    if (!activeItem || activeItem.type === 'general') {
      this.documentService.downloadDocument(docId).subscribe({
        next: (blob) => this.downloadBlob(blob, fileName),
        error: () => this.showError('studentSubmissionPage.messages.downloadError')
      });
    } else {
      const courseId = activeItem.id as number;
      const api = this.isLecturer()
        ? this.lecturerApi.downloadCourseDocument(courseId, docId)
        : this.studentApi.downloadCourseDocument(courseId, docId);

      api.subscribe({
        next: (blob) => this.downloadBlob(blob, fileName),
        error: () => this.showError('Fehler beim Herunterladen')
      });
    }
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  canUpload(): boolean {
    const activeId = this.activeSidebarItemId();
    const item = this.sidebarItems().find(i => i.id === activeId);
    if (!item) return false;

    if (this.isLecturer()) {
      // Lecturers can upload everywhere EXCEPT student uploads inbox
      return item.type !== 'student_upload';
    } else {
      // Students can ONLY upload to the student inbox
      return item.type === 'student_upload';
    }
  }

  private showError(key: string): void {
    this.snackBar.open(this.translate.instant(key), 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
  }
}
