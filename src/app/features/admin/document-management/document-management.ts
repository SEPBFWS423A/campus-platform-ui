import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../../common/services/document.service';
import { GeneralDocument, UploadGeneralDocumentRequest } from '../../../core/models/general-document';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-document-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './document-management.html',
  styleUrl: './document-management.scss'
})
export class DocumentManagement implements OnInit {
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);

  documents = signal<GeneralDocument[]>([]);
  displayedColumns: string[] = ['displayName', 'fileName', 'fileSize', 'uploadedAt', 'actions'];
  
  uploadForm = this.fb.group({
    displayName: ['', Validators.required],
    file: [null as File | null, Validators.required]
  });

  selectedFile: File | null = null;
  isUploading = signal(false);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documentService.adminGetDocuments().subscribe({
      next: (docs) => this.documents.set(docs),
      error: () => this.showError('documentManagement.noDocuments')
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
      if (!this.uploadForm.get('displayName')?.value) {
        this.uploadForm.patchValue({ displayName: file.name });
      }
    }
  }

  onUpload(): void {
    if (this.uploadForm.invalid || !this.selectedFile) return;

    this.isUploading.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      const request: UploadGeneralDocumentRequest = {
        displayName: this.uploadForm.value.displayName!,
        fileName: this.selectedFile!.name,
        mimeType: this.selectedFile!.type,
        contentBase64: base64String,
        fileSize: this.selectedFile!.size
      };

      this.documentService.uploadDocument(request).subscribe({
        next: () => {
          this.isUploading.set(false);
          this.uploadForm.reset();
          this.selectedFile = null;
          this.loadDocuments();
          this.showSuccess('documentManagement.uploadSuccess');
        },
        error: () => {
          this.isUploading.set(false);
          this.showError('documentManagement.uploadError');
        }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  onDelete(id: number): void {
    if (confirm(this.translate.instant('documentManagement.deleteMessage'))) {
      this.documentService.deleteDocument(id).subscribe({
        next: () => {
          this.loadDocuments();
          this.showSuccess('documentManagement.deleteSuccess');
        },
        error: () => this.showError('documentManagement.deleteError')
      });
    }
  }

  onDownload(id: number, fileName: string): void {
    this.documentService.downloadDocument(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.showError('studentSubmissionPage.messages.downloadError')
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private showSuccess(key: string): void {
    this.snackBar.open(this.translate.instant(key), 'OK', { duration: 3000 });
  }

  private showError(key: string): void {
    this.snackBar.open(this.translate.instant(key), 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
  }
}
