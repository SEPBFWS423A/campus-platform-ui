import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StudentApi } from '../../student/services/student-api';
import { FeedbackService, FeedbackResponse } from '../../../core/services/feedback.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Auth } from '../../../core/auth/auth';
import { UserRole } from '../../../core/models/user-role';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@angular/common';
import { LOCALE_ID, Inject } from '@angular/core';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss',
})
export class FeedbackComponent implements OnInit {
  private studentApi = inject(StudentApi);
  private feedbackService = inject(FeedbackService);
  private notificationService = inject(NotificationService);
  public auth = inject(Auth);

  UserRole = UserRole;

  // Student specific
  lecturers = signal<any[]>([]);
  selectedLecturerId: number | null = null;
  feedbackContent: string = '';
  isSubmitting = signal<boolean>(false);

  // Lecturer specific
  feedbacks = signal<FeedbackResponse[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    if (this.auth.userRole() === UserRole.Student) {
      this.loadLecturers();
    } else if (this.auth.userRole() === UserRole.Lecturer) {
      this.loadFeedback();
    }
  }

  // Student Logic
  loadLecturers() {
    this.studentApi.getLecturers().subscribe({
      next: (data) => this.lecturers.set(data),
      error: () => this.notificationService.showError('Dozenten konnten nicht geladen werden.')
    });
  }

  submitFeedback() {
    const lecturerId = this.selectedLecturerId;
    const content = this.feedbackContent;

    if (!lecturerId || !content.trim()) {
      this.notificationService.showError('Bitte wählen Sie einen Dozenten aus und geben Sie Feedback ein.');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackService.submitFeedback({ lecturerId, content }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Feedback erfolgreich anonym gesendet!');
        this.feedbackContent = '';
        this.selectedLecturerId = null;
        this.isSubmitting.set(false);
      },
      error: () => {
        this.notificationService.showError('Feedback konnte nicht gesendet werden.');
        this.isSubmitting.set(false);
      }
    });
  }

  // Lecturer Logic
  loadFeedback() {
    this.isLoading.set(true);
    this.feedbackService.getMyFeedback().subscribe({
      next: (data) => {
        this.feedbacks.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Feedback konnte nicht geladen werden.');
        this.isLoading.set(false);
      }
    });
  }

  downloadFeedbackAsPDF() {
    const doc = new jsPDF();
    const data = this.feedbacks();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241); // Indigo color matching theme
    doc.text('Anonymes Feedback Bericht', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Exportiert am: ${new Date().toLocaleString('de-DE')}`, 14, 30);
    doc.text(`Anzahl Feedbacks: ${data.length}`, 14, 38);
    
    // Create Table
    autoTable(doc, {
      startY: 45,
      head: [['Datum', 'Feedback Inhalt']],
      body: data.map(f => [
        new Date(f.createdAt).toLocaleString('de-DE'),
        f.content
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 6,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 255]
      }
    });
    
    // Save PDF
    const fileName = `Campus_Platform_Feedback_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    this.notificationService.showSuccess('Feedback-Bericht wurde heruntergeladen.');
  }
}
