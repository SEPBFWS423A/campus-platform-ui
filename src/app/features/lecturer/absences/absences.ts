import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
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

import { AbsenceType, ConflictingEventDto, LecturerAbsenceResponse } from '../models/lecturer.models';
import { LecturerAbsenceService } from '../services/lecturer-absence.service';
import { AbsenceConflictDialog } from './absence-conflict.dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// ---------------------------------------------------------------------------
// Einfacher Bestätigungs-Dialog (Löschen)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------
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
export class Absences implements OnInit, OnDestroy {
  private readonly absenceService = inject(LecturerAbsenceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  absences = signal<LecturerAbsenceResponse[]>([]);
  isLoading = signal(false);
  isCheckingConflicts = signal(false);

  // Sub-Issue #283 – Vorab-Prüfung: Signal wird nach Debounce befüllt
  conflictPreview = signal<ConflictingEventDto[]>([]);

  // Sub-Issue #285 – Severity-Schwellwerte
  conflictSeverity = computed(() => {
    const count = this.conflictPreview().length;
    if (count === 0) return 'NONE';
    if (count >= 3) return 'CRITICAL';
    return 'WARNING';
  });

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
    this.setupConflictPreview();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sub-Issue #283 – Debounced Vorab-Prüfung bei Datumseingabe
  private setupConflictPreview(): void {
    const startDate$ = this.absenceForm.controls.startDate.valueChanges;
    const endDate$   = this.absenceForm.controls.endDate.valueChanges;

    combineLatest([startDate$, endDate$])
      .pipe(
        debounceTime(700),
        switchMap(([start, end]) => {
          if (!start || !end) {
            this.conflictPreview.set([]);
            return of([]);
          }
          const startStr = this.toIsoLocalDateTime(start, false);
          const endStr   = this.toIsoLocalDateTime(end, true);
          this.isCheckingConflicts.set(true);
          return this.absenceService.checkConflicts(startStr, endStr).pipe(
            catchError(() => of([]))
          );
        })
      )
      .subscribe(conflicts => {
        this.conflictPreview.set(conflicts as ConflictingEventDto[]);
        this.isCheckingConflicts.set(false);
      });
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

  // Öffnet den Conflict-Dialog im Read-Only-Modus (Vorab-Info)
  openConflictPreviewDialog(): void {
    this.dialog.open(AbsenceConflictDialog, {
      data: { conflictingEvents: this.conflictPreview(), readOnly: true },
      width: '560px'
    });
  }

  onSubmit(): void {
    if (this.absenceForm.invalid) return;

    this.isLoading.set(true);
    const formVal = this.absenceForm.value;

    const req = {
      type: formVal.type!,
      startDate: this.parseLocalDate(formVal.startDate!),
      endDate: this.parseLocalDate(formVal.endDate!),
      note: formVal.note || ''
    };

    this.absenceService.createAbsence(req, false).subscribe({
      next: (res) => this.handleCreateSuccess(res),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          // Sub-Issue #281 – Konflikt-Detail-Dialog statt generischer Snackbar
          const body = err.error as { message?: string; conflictingEvents?: ConflictingEventDto[] };
          const events: ConflictingEventDto[] = body?.conflictingEvents ?? [];
          this.isLoading.set(false);

          const dialogRef = this.dialog.open(AbsenceConflictDialog, {
            data: { conflictingEvents: events, readOnly: false },
            width: '560px'
          });

          dialogRef.afterClosed().subscribe((force: boolean) => {
            if (force) {
              this.isLoading.set(true);
              this.absenceService.createAbsence(req, true).subscribe({
                next: (res) => this.handleCreateSuccess(res),
                error: () => {
                  this.snackBar.open('Fehler beim Eintragen.', 'OK', { duration: 3000 });
                  this.isLoading.set(false);
                }
              });
            }
          });
        } else {
          this.snackBar.open('Fehler beim Eintragen.', 'OK', { duration: 3000 });
          this.isLoading.set(false);
        }
      }
    });
  }

  private handleCreateSuccess(res: LecturerAbsenceResponse): void {
    this.snackBar.open('Abwesenheit wurde eingetragen.', 'OK', { duration: 3000 });
    this.absences.update(old =>
      [...old, res].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    );
    this.absenceForm.reset();
    Object.keys(this.absenceForm.controls).forEach(key => {
      this.absenceForm.get(key)?.setErrors(null);
    });
    this.conflictPreview.set([]);
    this.isLoading.set(false);
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

  // -----------------------------------------------------------------------
  // Hilfsmethoden
  // -----------------------------------------------------------------------

  private parseLocalDate(dateFn: Date): string {
    const offset = dateFn.getTimezoneOffset();
    const adjusted = new Date(dateFn.getTime() - offset * 60 * 1000);
    return adjusted.toISOString().split('T')[0];
  }

  private toIsoLocalDateTime(date: Date, endOfDay: boolean): string {
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    // Offset bereinigen damit kein UTC-Versatz entsteht
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().replace('Z', '').slice(0, 19);
  }
}
