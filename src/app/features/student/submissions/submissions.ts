import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { SubmissionsService } from '../../../core/services/submissions.service';
import {
  StudentSubmissionDetailResponse,
  StudentSubmissionListItemResponse,
  SubmissionDocumentResponse,
  SubmissionStatus,
  UploadSubmissionDocumentRequest,
} from '../../../core/models/submissions.models';

type SubmissionTab = 'ALL' | 'OPEN' | 'SUBMITTED' | 'GRADED';

@Component({
  selector: 'app-submissions',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './submissions.html',
  styleUrl: './submissions.scss',
})
export class Submissions implements OnInit {
  private readonly submissionsService = inject(SubmissionsService);

  submissions: StudentSubmissionListItemResponse[] = [];
  selectedSubmission: StudentSubmissionDetailResponse | null = null;

  activeTab: SubmissionTab = 'ALL';
  searchTerm = '';

  isLoadingList = false;
  isLoadingDetail = false;
  isUploading = false;
  isSubmitting = false;
  isModalOpen = false;

  errorMessage = '';
  successMessage = '';

  selectedFiles: File[] = [];

  readonly tabs: { labelKey: string; value: SubmissionTab }[] = [
    { labelKey: 'navigation.student.submissionsPage.tabs.all', value: 'ALL' },
    { labelKey: 'navigation.student.submissionsPage.tabs.open', value: 'OPEN' },
    { labelKey: 'navigation.student.submissionsPage.tabs.submitted', value: 'SUBMITTED' },
    { labelKey: 'navigation.student.submissionsPage.tabs.graded', value: 'GRADED' },
  ];

  readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  readonly allowedExtensions = ['.pdf', '.xlsx', '.pptx'];
  readonly maxFileSize = 1572864;

  ngOnInit(): void {
    console.log('Submissions ngOnInit gestartet');
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    console.log('loadSubmissions wurde aufgerufen');
    this.isLoadingList = true;
    this.errorMessage = '';

    this.submissionsService
      .getSubmissions()
      .pipe(finalize(() => (this.isLoadingList = false)))
      .subscribe({
        next: (data: StudentSubmissionListItemResponse[]) => {
          console.log('Submissions erfolgreich geladen:', data);
          this.submissions = data;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /api/users/submissions:', err);
          console.error('Status:', err.status);
          console.error('Body:', err.error);
          console.error('Message:', err.message);
          this.errorMessage = 'navigation.student.submissionsPage.messages.loadListError';
        },
      });
  }

  openSubmission(submissionId: number): void {
    console.log('openSubmission wurde aufgerufen mit submissionId:', submissionId);
    this.isLoadingDetail = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFiles = [];
    this.isModalOpen = true;

    this.submissionsService
      .getSubmissionDetail(submissionId)
      .pipe(finalize(() => (this.isLoadingDetail = false)))
      .subscribe({
        next: (detail: StudentSubmissionDetailResponse) => {
          console.log('Submission-Detail erfolgreich geladen:', detail);
          this.selectedSubmission = detail;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /api/users/submissions/{id}:', err);
          console.error('Status:', err.status);
          console.error('Body:', err.error);
          console.error('Message:', err.message);
          this.errorMessage = 'navigation.student.submissionsPage.messages.loadDetailError';
          this.isModalOpen = false;
        },
      });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSubmission = null;
    this.selectedFiles = [];
    this.successMessage = '';
  }

  setTab(tab: SubmissionTab): void {
    this.activeTab = tab;
  }

  get filteredSubmissions(): StudentSubmissionListItemResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.submissions.filter((submission) => {
      const matchesTab = this.matchesActiveTab(submission);
      const examType = (submission.examTypeName ?? '').toLowerCase();
      const status = this.getStatusLabel(submission.status, submission.hasDocuments).toLowerCase();

      return matchesTab && (!term || examType.includes(term) || status.includes(term));
    });
  }

  private matchesActiveTab(submission: StudentSubmissionListItemResponse): boolean {
    switch (this.activeTab) {
      case 'OPEN':
        return submission.status === 'PENDING';
      case 'SUBMITTED':
        return submission.status === 'SUBMITTED';
      case 'GRADED':
        return submission.status === 'GRADED';
      default:
        return true;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.errorMessage = '';
    this.successMessage = '';

    const validFiles: File[] = [];

    for (const file of files) {
      const validationError = this.validateSelectedFile(file);
      if (validationError) {
        this.errorMessage = validationError;
        continue;
      }
      validFiles.push(file);
    }

    this.selectedFiles = validFiles;
    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
  }

  async uploadSelectedFiles(): Promise<void> {
    if (!this.selectedSubmission || this.selectedFiles.length === 0 || !this.selectedSubmission.editable) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      for (const file of this.selectedFiles) {
        const payload: UploadSubmissionDocumentRequest = {
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          contentBase64: await this.toBase64(file),
        };

        await firstValueFrom(
          this.submissionsService.uploadDocument(this.selectedSubmission.submissionId, payload)
        );
      }

      this.selectedFiles = [];
      this.successMessage = 'navigation.student.submissionsPage.messages.uploadSuccess';
      await this.refreshCurrentSubmissionAndList();
    } catch (err) {
      console.error('Fehler POST /api/users/submissions/{id}/documents:', err);
      this.errorMessage = 'navigation.student.submissionsPage.messages.uploadError';
    } finally {
      this.isUploading = false;
    }
  }

  deleteDocument(documentItem: SubmissionDocumentResponse): void {
    if (!this.selectedSubmission || !this.selectedSubmission.editable) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.submissionsService
      .deleteDocument(this.selectedSubmission.submissionId, documentItem.id)
      .subscribe({
        next: async () => {
          this.successMessage = 'navigation.student.submissionsPage.messages.deleteSuccess';
          await this.refreshCurrentSubmissionAndList();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler DELETE /api/users/submissions/{id}/documents/{documentId}:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.deleteError';
        },
      });
  }

  downloadDocument(documentItem: SubmissionDocumentResponse): void {
    if (!this.selectedSubmission) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.submissionsService
      .downloadDocument(this.selectedSubmission.submissionId, documentItem.id)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = documentItem.fileName;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /api/users/submissions/{id}/documents/{documentId}/download:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.downloadError';
        },
      });
  }

  submitCurrentSubmission(): void {
    if (!this.selectedSubmission || !this.selectedSubmission.finalSubmitAllowed) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.submissionsService
      .submitSubmission(this.selectedSubmission.submissionId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: async () => {
          this.successMessage = 'navigation.student.submissionsPage.messages.submitSuccess';
          await this.refreshCurrentSubmissionAndList();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler POST /api/users/submissions/{id}/submit:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.submitError';
        },
      });
  }

  private async refreshCurrentSubmissionAndList(): Promise<void> {
    const currentId = this.selectedSubmission?.submissionId;

    const submissions = await firstValueFrom(this.submissionsService.getSubmissions());
    this.submissions = submissions;

    if (currentId) {
      const detail = await firstValueFrom(this.submissionsService.getSubmissionDetail(currentId));
      this.selectedSubmission = detail;
    }
  }

  private validateSelectedFile(file: File): string | null {
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = this.allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasAllowedExtension) {
      return 'navigation.student.submissionsPage.messages.invalidFileType';
    }

    if (!this.allowedMimeTypes.includes(file.type)) {
      return 'navigation.student.submissionsPage.messages.invalidMimeType';
    }

    if (file.size > this.maxFileSize) {
      return 'navigation.student.submissionsPage.messages.fileTooLarge';
    }

    return null;
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  getStatusLabel(status: SubmissionStatus, hasDocuments: boolean): string {
    if (status === 'PENDING' && !hasDocuments) return 'Ausstehend';
    if (status === 'PENDING' && hasDocuments) return 'In Bearbeitung';
    if (status === 'SUBMITTED') return 'Eingereicht';
    return 'Bewertet';
  }

  getStatusClass(status: SubmissionStatus, hasDocuments: boolean): string {
    if (status === 'PENDING' && !hasDocuments) return 'status-pending';
    if (status === 'PENDING' && hasDocuments) return 'status-progress';
    if (status === 'SUBMITTED') return 'status-submitted';
    return 'status-graded';
  }

  formatDate(value: string | null): string {
    if (!value) return '—';

    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatDateTime(value: string | null): string {
    if (!value) return '—';

    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
