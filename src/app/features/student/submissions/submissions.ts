import {CommonModule} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {AfterViewInit, ChangeDetectorRef, Component, inject,} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {finalize, firstValueFrom} from 'rxjs';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {SubmissionsService} from '../../../core/services/submissions.service';
import {
  StudentSubmissionDetailResponse,
  StudentSubmissionListItemResponse,
  SubmissionDocumentResponse,
  SubmissionStatus,
  UploadSubmissionDocumentRequest,
} from '../../../core/models/submissions.models';

type SubmissionTab = 'ALL' | 'OPEN' | 'SUBMITTED' | 'GRADED';
type UiSubmissionStatus =
  | 'pending-empty'
  | 'progress'
  | 'submitted'
  | 'submitted-closed'
  | 'overdue'
  | 'graded';

type SubmissionViewState = {
  status: SubmissionStatus;
  hasDocuments: boolean;
  submissionDeadline: string | null;
  effectiveSubmissionDeadline?: string | null;
};

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './submissions.html',
  styleUrl: './submissions.scss',
})
export class Submissions implements AfterViewInit {
  private readonly submissionsService = inject(SubmissionsService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  submissions: StudentSubmissionListItemResponse[] = [];
  selectedSubmission: StudentSubmissionDetailResponse | null = null;

  activeTab: SubmissionTab = 'ALL';
  searchTerm = '';

  isLoadingList = true;
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
  readonly dueSoonThresholdDays = 7;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadSubmissions();
      this.syncView();
    }, 0);
  }

  loadSubmissions(): void {
    this.isLoadingList = true;
    this.errorMessage = '';
    this.syncView();

    this.submissionsService
      .getSubmissions()
      .pipe(
        finalize(() => {
          this.isLoadingList = false;
          this.syncView();
        })
      )
      .subscribe({
        next: (data: StudentSubmissionListItemResponse[]) => {
          this.submissions = data;
          this.syncView();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /users/submissions:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.loadListError';
          this.syncView();
        },
      });
  }

  openSubmission(submissionId: number): void {
    this.isLoadingDetail = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFiles = [];
    this.selectedSubmission = null;
    this.isModalOpen = true;
    this.syncView();

    this.submissionsService
      .getSubmissionDetail(submissionId)
      .pipe(
        finalize(() => {
          this.isLoadingDetail = false;
          this.syncView();
        })
      )
      .subscribe({
        next: (detail: StudentSubmissionDetailResponse) => {
          this.selectedSubmission = detail;
          this.syncView();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /users/submissions/{id}:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.loadDetailError';
          this.isModalOpen = false;
          this.syncView();
        },
      });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedSubmission = null;
    this.selectedFiles = [];
    this.successMessage = '';
    this.isLoadingDetail = false;
    this.syncView();
  }

  setTab(tab: SubmissionTab): void {
    this.activeTab = tab;
    this.syncView();
  }

  get overdueSubmissions(): StudentSubmissionListItemResponse[] {
    if (this.activeTab !== 'ALL') {
      return [];
    }

    const term = this.searchTerm.trim().toLowerCase();

    return this.submissions.filter((submission) => {
      if (this.resolveUiStatus(submission) !== 'overdue') {
        return false;
      }

      return this.matchesSearchTerm(submission, term);
    });
  }

  get regularFilteredSubmissions(): StudentSubmissionListItemResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.submissions.filter((submission) => {
      const uiStatus = this.resolveUiStatus(submission);

      if (this.activeTab === 'ALL' && uiStatus === 'overdue') {
        return false;
      }

      const matchesTab = this.matchesActiveTab(submission);
      if (!matchesTab) {
        return false;
      }

      return this.matchesSearchTerm(submission, term);
    });
  }

  private matchesSearchTerm(submission: StudentSubmissionListItemResponse, term: string): boolean {
    if (!term) {
      return true;
    }

    const courseName = (submission.courseName ?? '').toLowerCase();
    const examType = (submission.examTypeName ?? '').toLowerCase();
    const groups = (submission.studyGroupNames ?? []).join(' ').toLowerCase();
    const status = this.translate.instant(this.getStatusLabelKey(submission)).toLowerCase();
    const hint = this.translate.instant(this.getStatusHintKey(submission)).toLowerCase();
    const dueSoon = this.isDueSoon(submission)
      ? this.translate.instant('navigation.student.submissionsPage.statusLabels.dueSoon').toLowerCase()
      : '';

    return (
      courseName.includes(term) ||
      examType.includes(term) ||
      groups.includes(term) ||
      status.includes(term) ||
      hint.includes(term) ||
      dueSoon.includes(term)
    );
  }

  private matchesActiveTab(submission: StudentSubmissionListItemResponse): boolean {
    const uiStatus = this.resolveUiStatus(submission);

    switch (this.activeTab) {
      case 'OPEN':
        return uiStatus === 'pending-empty' || uiStatus === 'progress';
      case 'SUBMITTED':
        return uiStatus === 'submitted' || uiStatus === 'submitted-closed';
      case 'GRADED':
        return uiStatus === 'graded';
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
    this.syncView();
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
    this.syncView();
  }

  async uploadSelectedFiles(): Promise<void> {
    if (!this.selectedSubmission || this.selectedFiles.length === 0 || !this.selectedSubmission.editable) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.syncView();

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
      this.syncView();
    } catch (err) {
      console.error('Fehler POST /users/submissions/{id}/documents:', err);
      this.errorMessage = 'navigation.student.submissionsPage.messages.uploadError';
      this.syncView();
    } finally {
      this.isUploading = false;
      this.syncView();
    }
  }

  deleteDocument(documentItem: SubmissionDocumentResponse): void {
    if (!this.selectedSubmission || !this.selectedSubmission.editable) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.syncView();

    this.submissionsService
      .deleteDocument(this.selectedSubmission.submissionId, documentItem.id)
      .subscribe({
        next: async () => {
          this.successMessage = 'navigation.student.submissionsPage.messages.deleteSuccess';
          await this.refreshCurrentSubmissionAndList();
          this.syncView();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler DELETE /users/submissions/{id}/documents/{documentId}:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.deleteError';
          this.syncView();
        },
      });
  }

  downloadDocument(documentItem: SubmissionDocumentResponse): void {
    if (!this.selectedSubmission) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.syncView();

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
          this.syncView();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler GET /users/submissions/{id}/documents/{documentId}/download:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.downloadError';
          this.syncView();
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
    this.syncView();

    this.submissionsService
      .submitSubmission(this.selectedSubmission.submissionId)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.syncView();
        })
      )
      .subscribe({
        next: async () => {
          this.successMessage = 'navigation.student.submissionsPage.messages.submitSuccess';
          await this.refreshCurrentSubmissionAndList();
          this.syncView();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Fehler POST /users/submissions/{id}/submit:', err);
          this.errorMessage = 'navigation.student.submissionsPage.messages.submitError';
          this.syncView();
        },
      });
  }

  private async refreshCurrentSubmissionAndList(): Promise<void> {
    const currentId = this.selectedSubmission?.submissionId;

    this.submissions = await firstValueFrom(this.submissionsService.getSubmissions());

    if (currentId) {
      this.selectedSubmission = await firstValueFrom(this.submissionsService.getSubmissionDetail(currentId));
    }

    this.syncView();
  }

  getStatusClass(item: SubmissionViewState): string {
    switch (this.resolveUiStatus(item)) {
      case 'pending-empty':
        return 'status-pending';
      case 'progress':
        return 'status-progress';
      case 'submitted':
        return 'status-submitted';
      case 'submitted-closed':
        return 'status-submitted-closed';
      case 'overdue':
        return 'status-overdue';
      case 'graded':
        return 'status-graded';
    }
  }

  getStatusLabelKey(item: SubmissionViewState): string {
    switch (this.resolveUiStatus(item)) {
      case 'pending-empty':
        return 'navigation.student.submissionsPage.statusLabels.pendingEmpty';
      case 'progress':
        return 'navigation.student.submissionsPage.statusLabels.inProgress';
      case 'submitted':
        return 'navigation.student.submissionsPage.statusLabels.submitted';
      case 'submitted-closed':
        return 'navigation.student.submissionsPage.statusLabels.submittedClosed';
      case 'overdue':
        return 'navigation.student.submissionsPage.statusLabels.overdue';
      case 'graded':
        return 'navigation.student.submissionsPage.statusLabels.graded';
    }
  }

  getStatusHintKey(item: SubmissionViewState): string {
    switch (this.resolveUiStatus(item)) {
      case 'pending-empty':
        return 'navigation.student.submissionsPage.statusHints.pendingEmpty';
      case 'progress':
        return 'navigation.student.submissionsPage.statusHints.inProgress';
      case 'submitted':
        return 'navigation.student.submissionsPage.statusHints.submitted';
      case 'submitted-closed':
        return 'navigation.student.submissionsPage.statusHints.submittedClosed';
      case 'overdue':
        return item.hasDocuments
          ? 'navigation.student.submissionsPage.statusHints.overdueWithDocuments'
          : 'navigation.student.submissionsPage.statusHints.overdueWithoutDocuments';
      case 'graded':
        return 'navigation.student.submissionsPage.statusHints.graded';
    }
  }

  isDueSoon(item: SubmissionViewState): boolean {
    if (item.status !== 'PENDING') {
      return false;
    }

    const deadline = item.effectiveSubmissionDeadline ?? item.submissionDeadline;

    if (this.isDeadlinePassed(deadline)) {
      return false;
    }

    const deadlineDate = this.parseDate(deadline);
    if (!deadlineDate) {
      return false;
    }

    const diffMs = deadlineDate.getTime() - Date.now();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= this.dueSoonThresholdDays;
  }

  private resolveUiStatus(item: SubmissionViewState): UiSubmissionStatus {
    if (item.status === 'GRADED') {
      return 'graded';
    }

    if (item.status === 'SUBMITTED') {
      return this.isDeadlinePassed(item.submissionDeadline) ? 'submitted-closed' : 'submitted';
    }

    if (this.isDeadlinePassed(item.submissionDeadline)) {
      return 'overdue';
    }

    return item.hasDocuments ? 'progress' : 'pending-empty';
  }

  private isDeadlinePassed(deadline: string | null): boolean {
    const deadlineDate = this.parseDate(deadline);
    if (!deadlineDate) {
      return false;
    }

    return deadlineDate.getTime() < Date.now();
  }

  private parseDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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

  private syncView(): void {
    try {
      this.cdr.detectChanges();
    } catch {
      // bewusst leer
    }
  }
}
