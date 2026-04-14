import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AbsenceType, LecturerAbsenceResponse } from '../models/lecturer.models';
import { LecturerAbsenceService } from '../services/lecturer-absence.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'absences.deleteConfirm' | translate }}</h2>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-button color="warn" [mat-dialog-close]="true">Löschen</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialog {}

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './absences.html',
  styleUrls: ['./absences.scss']
})
export class Absences implements OnInit {
  private readonly absenceService = inject(LecturerAbsenceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  absences = signal<LecturerAbsenceResponse[]>([]);
  isLoading = signal(false);

  absenceForm = new FormGroup({
    type: new FormControl<AbsenceType | null>(null, Validators.required),
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required),
    note: new FormControl('')
  });

  displayedColumns = ['status', 'type', 'startDate', 'endDate', 'note', 'actions'];
  absenceTypes = Object.values(AbsenceType);

  ngOnInit() {
    this.loadAbsences();
  }

  loadAbsences() {
    this.isLoading.set(true);
    this.absenceService.getMyAbsences().subscribe({
      next: (data) => {
        this.absences.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatus(absence: LecturerAbsenceResponse): 'VERGANGEN' | 'AKTUELL' | 'GEPLANT' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(absence.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(absence.endDate);
    end.setHours(23, 59, 59, 999);

    if (end < today) return 'VERGANGEN';
    if (start <= today && end >= today) return 'AKTUELL';
    return 'GEPLANT';
  }

  onSubmit(): void {
    if (this.absenceForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.absenceForm.value;

    const parseLocalDate = (dateFn: Date) => {
        const offset = dateFn.getTimezoneOffset();
        const yourDate = new Date(dateFn.getTime() - (offset*60*1000));
        return yourDate.toISOString().split('T')[0];
    };

    const req = {
      type: formVal.type!,
      startDate: parseLocalDate(formVal.startDate!),
      endDate: parseLocalDate(formVal.endDate!),
      note: formVal.note || ''
    };

    this.absenceService.createAbsence(req).subscribe({
      next: (res) => {
        this.snackBar.open('Abwesenheit wurde eingetragen.', 'OK', { duration: 3000 });
        this.absences.update(old => [...old, res].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
        this.absenceForm.reset();
        Object.keys(this.absenceForm.controls).forEach(key => {
          this.absenceForm.get(key)?.setErrors(null);
        });
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.snackBar.open('Terminkonflikt: In diesem Zeitraum sind bereits Lehrveranstaltungen geplant.', 'OK', { duration: 5000 });
        } else {
          this.snackBar.open('Fehler beim Eintragen.', 'OK', { duration: 3000 });
        }
        this.isLoading.set(false);
      }
    });
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialog);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isLoading.set(true);
        this.absenceService.deleteAbsence(id).subscribe({
          next: () => {
            this.snackBar.open('Abwesenheit wurde gelöscht.', 'OK', { duration: 3000 });
            this.absences.update(old => old.filter(a => a.id !== id));
            this.isLoading.set(false);
          },
          error: () => {
            this.snackBar.open('Fehler beim Löschen.', 'OK', { duration: 3000 });
            this.isLoading.set(false);
          }
        });
      }
    });
  }
}
