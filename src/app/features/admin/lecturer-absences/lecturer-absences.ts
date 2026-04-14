import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { LecturerAbsenceResponse, ConflictingEventDto, AbsenceStatus } from '../../lecturer/models/lecturer.models';
import { AdminAbsenceService } from '../services/admin-absence.service';
import { LecturerAbsenceService } from '../../lecturer/services/lecturer-absence.service';
import { AbsenceConflictDialog } from '../../lecturer/absences/absence-conflict.dialog';
import { ConfirmDialog } from '../../lecturer/absences/absences';
import { RejectAbsenceDialog } from './reject-absence.dialog';

export type ConflictSeverity = 'NONE' | 'WARNING' | 'CRITICAL';

export interface AbsenceWithConflicts extends LecturerAbsenceResponse {
  conflictSeverity?: ConflictSeverity;
  conflictingEvents?: ConflictingEventDto[];
}

@Component({
  selector: 'app-lecturer-absences-admin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule,
    MatCardModule, MatTableModule, MatChipsModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './lecturer-absences.html',
  styleUrls: ['./lecturer-absences.scss']
})
export class LecturerAbsencesAdmin implements OnInit {
  private readonly adminAbsenceService = inject(AdminAbsenceService);
  private readonly absenceService = inject(LecturerAbsenceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  absences = signal<AbsenceWithConflicts[]>([]);
  isLoading = signal(false);
  processingIds = signal<Set<number>>(new Set());

  lecturers = computed(() => {
    const names = new Set(this.absences().map(a => a.lecturerName).filter(Boolean));
    return Array.from(names).sort();
  });

  lecturerFilter = new FormControl<string>('ALL');
  statusFilter   = new FormControl<string>('ALL');

  displayedColumns = ['lecturer', 'approvalStatus', 'type', 'startDate', 'endDate', 'note', 'conflicts', 'actions'];

  filteredAbsences = computed(() => {
    const lf = this.lecturerFilter.value;
    const sf = this.statusFilter.value;
    return this.absences().filter(a =>
      (!lf || lf === 'ALL' || a.lecturerName === lf) &&
      (!sf || sf === 'ALL' || a.status === sf)
    );
  });

  readonly statusOptions: { value: string; label: string }[] = [
    { value: 'ALL',           label: 'Alle Status' },
    { value: 'BEANTRAGT',     label: 'Beantragt' },
    { value: 'GENEHMIGT',     label: 'Genehmigt' },
    { value: 'ABGELEHNT',     label: 'Abgelehnt' },
    { value: 'STORNIERT',     label: 'Storniert' },
    { value: 'ABGESCHLOSSEN', label: 'Abgeschlossen' }
  ];

  ngOnInit() { this.loadAbsences(); }

  loadAbsences() {
    this.isLoading.set(true);
    this.adminAbsenceService.getAllAbsences().subscribe({
      next: (data) => {
        this.absences.set(data.map(a => ({ ...a, conflictSeverity: 'NONE', conflictingEvents: [] })));
        this.isLoading.set(false);
        this.enrichWithConflicts(data);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  private enrichWithConflicts(data: LecturerAbsenceResponse[]): void {
    const geplant = data.filter(a => this.isUpcoming(a));
    if (geplant.length === 0) return;

    forkJoin(
      geplant.map(a =>
        this.absenceService.checkConflicts(a.startDate + 'T00:00:00', a.endDate + 'T23:59:59')
          .pipe(catchError(() => of([])))
      )
    ).subscribe((results: ConflictingEventDto[][]) => {
      const map = new Map<number, { severity: ConflictSeverity; events: ConflictingEventDto[] }>();
      geplant.forEach((a, i) => {
        const evts = results[i] as ConflictingEventDto[];
        map.set(a.id, {
          severity: evts.length === 0 ? 'NONE' : evts.length >= 3 ? 'CRITICAL' : 'WARNING',
          events: evts
        });
      });
      this.absences.update(current =>
        current.map(a => {
          const info = map.get(a.id);
          return info ? { ...a, conflictSeverity: info.severity, conflictingEvents: info.events } : a;
        })
      );
    });
  }

  private isUpcoming(a: LecturerAbsenceResponse): boolean {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(a.endDate) >= today;
  }

  /** Sub-Issue #292: Genehmigen */
  onApprove(absence: AbsenceWithConflicts): void {
    this.setProcessing(absence.id, true);
    this.adminAbsenceService.approveAbsence(absence.id).subscribe({
      next: (updated) => {
        this.snackBar.open('Abwesenheit genehmigt.', 'OK', { duration: 3000 });
        this.updateAbsence(updated);
        this.setProcessing(absence.id, false);
      },
      error: () => {
        this.snackBar.open('Fehler beim Genehmigen.', 'OK', { duration: 3000 });
        this.setProcessing(absence.id, false);
      }
    });
  }

  /** Sub-Issue #292: Ablehnen */
  onReject(absence: AbsenceWithConflicts): void {
    this.dialog.open(RejectAbsenceDialog, { width: '460px' })
      .afterClosed().subscribe((reason: string | null) => {
        if (reason) {
          this.setProcessing(absence.id, true);
          this.adminAbsenceService.rejectAbsence(absence.id, reason).subscribe({
            next: (updated) => {
              this.snackBar.open('Abwesenheit abgelehnt.', 'OK', { duration: 3000 });
              this.updateAbsence(updated);
              this.setProcessing(absence.id, false);
            },
            error: () => {
              this.snackBar.open('Fehler beim Ablehnen.', 'OK', { duration: 3000 });
              this.setProcessing(absence.id, false);
            }
          });
        }
      });
  }

  openConflictDialog(absence: AbsenceWithConflicts): void {
    if (!absence.conflictingEvents?.length) return;
    this.dialog.open(AbsenceConflictDialog, {
      data: { conflictingEvents: absence.conflictingEvents, readOnly: true },
      width: '560px'
    });
  }

  onDelete(id: number): void {
    this.dialog.open(ConfirmDialog).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.adminAbsenceService.deleteAbsence(id).subscribe({
          next: () => {
            this.snackBar.open('Abwesenheit gelöscht.', 'OK', { duration: 3000 });
            this.absences.update(old => old.filter(a => a.id !== id));
          },
          error: () => this.snackBar.open('Fehler beim Löschen.', 'OK', { duration: 3000 })
        });
      }
    });
  }

  isProcessing(id: number): boolean {
    return this.processingIds().has(id);
  }

  private setProcessing(id: number, processing: boolean): void {
    this.processingIds.update(set => {
      const next = new Set(set);
      processing ? next.add(id) : next.delete(id);
      return next;
    });
  }

  private updateAbsence(updated: LecturerAbsenceResponse): void {
    this.absences.update(old =>
      old.map(a => a.id === updated.id ? { ...a, ...updated } : a)
    );
  }
}
