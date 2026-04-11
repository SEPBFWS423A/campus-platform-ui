import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentService } from '../services/document.service';
import { GeneralDocument } from '../../../core/models/general-document';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './downloads.html',
  styleUrl: './downloads.scss',
})
export class Downloads implements OnInit {
  private documentService = inject(DocumentService);
  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);

  documents = signal<GeneralDocument[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.documentService.getDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('documentManagement.noDocuments');
      }
    });
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

  private showError(key: string): void {
    this.snackBar.open(this.translate.instant(key), 'OK', { duration: 3000, panelClass: ['error-snackbar'] });
  }
}
