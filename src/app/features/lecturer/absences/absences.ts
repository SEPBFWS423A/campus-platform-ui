import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LecturerApi } from '../services/lecturer-api';
import { LecturerAbsence } from '../models/lecturer.models';
import { AddAbsenceDialog } from './add-absence-dialog/add-absence-dialog';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './absences.html',
  styleUrl: './absences.scss'
})
export class Absences implements OnInit {
  absences = signal<LecturerAbsence[]>([]);
  isLoading = signal(false);

  constructor(
    private lecturerApi: LecturerApi,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAbsences();
  }

  loadAbsences(): void {
    this.isLoading.set(true);
    this.lecturerApi.getAbsences().subscribe({
      next: (data) => {
        this.absences.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.translate.instant('absences.messages.loadError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddAbsenceDialog, {
      width: '480px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.lecturerApi.createAbsence(result).subscribe({
          next: () => {
            this.snackBar.open(
              this.translate.instant('absences.messages.createSuccess'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
            this.loadAbsences();
          },
          error: () => {
            this.snackBar.open(
              this.translate.instant('absences.messages.createError'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  deleteAbsence(absence: LecturerAbsence): void {
    this.translate.get([
      'absences.deleteDialog.title',
      'absences.deleteDialog.message',
      'absences.deleteDialog.confirm',
      'common.cancel',
      'absences.messages.deleteSuccess',
      'common.close'
    ]).subscribe(translations => {
      const dialogRef = this.dialog.open(ConfirmationDialog, {
        data: {
          title: translations['absences.deleteDialog.title'],
          message: translations['absences.deleteDialog.message'],
          confirmText: translations['absences.deleteDialog.confirm'],
          cancelText: translations['common.cancel']
        }
      });

      dialogRef.afterClosed().subscribe(confirmed => {
        if (confirmed) {
          this.lecturerApi.deleteAbsence(absence.id).subscribe({
            next: () => {
              this.snackBar.open(
                translations['absences.messages.deleteSuccess'],
                translations['common.close'],
                { duration: 3000 }
              );
              this.loadAbsences();
            },
            error: () => {
              this.snackBar.open(
                this.translate.instant('absences.messages.deleteError'),
                this.translate.instant('common.close'),
                { duration: 3000 }
              );
            }
          });
        }
      });
    });
  }
}
