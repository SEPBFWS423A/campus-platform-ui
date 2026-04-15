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

import { AbsenceType, AbsencePriority, ConflictingEventDto, LecturerAbsenceResponse } from '../models/lecturer.models';
import { LecturerAbsenceService } from '../services/lecturer-absence.service';
import { AbsenceConflictDialog } from './absence-conflict.dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, combineLatest } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// ---------------------------------------------------------------------------
// Bestätigungs-Dialog (Löschen)
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

  // Conflict preview (Issue #9)
  conflictPreview = signal<ConflictingEventDto[]>([]);
  conflictSeverity = computed(() => {
    const count = this.conflictPreview().length;
    if (count === 0) return 'NONE';
    if (count >= 3) return 'CRITICAL';
    return 'WARNING';
  });

  absenceForm = new FormGroup({
    type:      new FormControl<AbsenceType | null>(null, Validators.required),
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate:   new FormControl<Date | null>(null, Validators.required),
    note:      new FormControl(''),
    priority:  new FormControl<AbsencePriority>('MEDIUM')
  });

  displayedColumns = ['approvalStatus', 'type', 'startDate', 'endDate', 'note', 'docs', 'actions'];
  absenceTypes  = Object.values(AbsenceType);
  priorityOptions: { value: AbsencePriority; label: string }[] = [
    { value: 'LOW',      label: 'Niedrig' },
    { value: 'MEDIUM',   label: 'Mittel' },
    { value: 'HIGH',     label: 'Hoch' },
    { value: 'CRITICAL', label: 'Kritisch' }
  ];

  ngOnInit() {
    this.loadAbsences();
    this.setupConflictPreview();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Debounced Vorab-Prüfung (Issue #9)
  private setupConflictPreview(): void {
    combineLatest([
      this.absenceForm.controls.startDate.valueChanges,
      this.absenceForm.controls.endDate.valueChanges
    ])
      .pipe(
        debounceTime(700),
        switchMap(([start, end]) => {
          if (!start || !end) { this.conflictPreview.set([]); return of([]); }
          this.isCheckingConflicts.set(true);
          return this.absenceService.checkConflicts(
            this.toIsoLocalDateTime(start, false),
            this.toIsoLocalDateTime(end, true)
          ).pipe(catchError(() => of([])));
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
      next: (data) => { this.absences.set(data); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  getTimeStatus(absence: LecturerAbsenceResponse): 'VERGANGEN' | 'AKTUELL' | 'GEPLANT' {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(absence.startDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(absence.endDate);   end.setHours(23, 59, 59, 999);
    if (end < today) return 'VERGANGEN';
    if (start <= today && end >= today) return 'AKTUELL';
    return 'GEPLANT';
  }

  openConflictPreviewDialog(): void {
    this.dialog.open(AbsenceConflictDialog, {
      data: { conflictingEvents: this.conflictPreview(), readOnly: true },
      width: '560px'
    });
  }

  onSubmit(): void {
    if (this.absenceForm.invalid) return;
    this.isLoading.set(true);
    const fv = this.absenceForm.value;
    const req = {
      type:      fv.type!,
      startDate: this.parseLocalDate(fv.startDate!),
      endDate:   this.parseLocalDate(fv.endDate!),
      note:      fv.note || '',
      priority:  fv.priority ?? 'MEDIUM'
    };

    this.absenceService.createAbsence(req, false).subscribe({
      next: (res) => this.handleCreateSuccess(res),
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          const body = err.error as { message?: string; conflictingEvents?: ConflictingEventDto[] };
          const events = body?.conflictingEvents ?? [];
          this.isLoading.set(false);
          this.dialog.open(AbsenceConflictDialog, {
            data: { conflictingEvents: events, readOnly: false }, width: '560px'
          }).afterClosed().subscribe((force: boolean) => {
            if (force) {
              this.isLoading.set(true);
              this.absenceService.createAbsence(req, true).subscribe({
                next: (res) => this.handleCreateSuccess(res),
                error: () => { this.snackBar.open('Fehler beim Eintragen.', 'OK', { duration: 3000 }); this.isLoading.set(false); }
              });
            }
          });
        } else if (err.status === 400) {
          const msg = err.error?.message ?? 'Validierungsfehler – bitte Eingaben prüfen.';
          this.snackBar.open(this.translateValidationError(msg), 'OK', { duration: 6000 });
          this.isLoading.set(false);
        } else {
          this.snackBar.open('Fehler beim Eintragen.', 'OK', { duration: 3000 });
          this.isLoading.set(false);
        }
      }
    });
  }

  private handleCreateSuccess(res: LecturerAbsenceResponse): void {
    this.snackBar.open('Abwesenheit wurde beantragt.', 'OK', { duration: 3000 });
    this.absences.update(old =>
      [...old, res].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    );
    this.absenceForm.reset({ priority: 'MEDIUM' });
    Object.keys(this.absenceForm.controls).forEach(k => this.absenceForm.get(k)?.setErrors(null));
    this.conflictPreview.set([]);
    this.isLoading.set(false);
  }

  onDelete(id: number): void {
    this.dialog.open(ConfirmDialog).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isLoading.set(true);
        this.absenceService.deleteAbsence(id).subscribe({
          next: () => {
            this.snackBar.open('Abwesenheit wurde gelöscht.', 'OK', { duration: 3000 });
            this.absences.update(old => old.filter(a => a.id !== id));
            this.isLoading.set(false);
          },
          error: () => { this.snackBar.open('Fehler beim Löschen.', 'OK', { duration: 3000 }); this.isLoading.set(false); }
        });
      }
    });
  }

  // -----------------------------------------------------------------------
  // Hilfsmethoden
  // -----------------------------------------------------------------------

  private parseLocalDate(dateFn: Date): string {
    const offset = dateFn.getTimezoneOffset();
    return new Date(dateFn.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
  }

  private toIsoLocalDateTime(date: Date, endOfDay: boolean): string {
    const d = new Date(date);
    endOfDay ? d.setHours(23, 59, 59, 0) : d.setHours(0, 0, 0, 0);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60 * 1000).toISOString().replace('Z', '').slice(0, 19);
  }

  private translateValidationError(key: string): string {
    const map: Record<string, string> = {
      'absence.validation.urlaub.notice':          'Urlaub muss mindestens 14 Tage im Voraus beantragt werden.',
      'absence.validation.urlaub.maxDuration':     'Urlaubsanträge dürfen maximal 30 Tage umfassen.',
      'absence.validation.dienstreise.notice':     'Dienstreisen müssen mindestens 7 Tage im Voraus beantragt werden.'
    };
    return map[key] ?? key;
  }
}
