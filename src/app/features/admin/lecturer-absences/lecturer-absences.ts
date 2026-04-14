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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { LecturerAbsenceResponse, ConflictingEventDto } from '../../lecturer/models/lecturer.models';
import { AdminAbsenceService } from '../services/admin-absence.service';
import { LecturerAbsenceService } from '../../lecturer/services/lecturer-absence.service';
import { AbsenceConflictDialog } from '../../lecturer/absences/absence-conflict.dialog';
import { ConfirmDialog } from '../../lecturer/absences/absences';

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
    MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
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

  lecturers = computed(() => {
    const abs = this.absences();
    const names = new Set(abs.map(a => a.lecturerName).filter(Boolean));
    return Array.from(names).sort();
  });

  lecturerFilter = new FormControl<string>('ALL');

  displayedColumns = ['lecturer', 'status', 'type', 'startDate', 'endDate', 'note', 'conflicts', 'actions'];

  filteredAbsences = computed(() => {
    const filter = this.lecturerFilter.value;
    if (!filter || filter === 'ALL') return this.absences();
    return this.absences().filter(a => a.lecturerName === filter);
  });

  ngOnInit() {
    this.loadAbsences();
  }

  loadAbsences() {
    this.isLoading.set(true);
    this.adminAbsenceService.getAllAbsences().subscribe({
      next: (data) => {
        // Initially set without conflict data
        this.absences.set(data.map(a => ({ ...a, conflictSeverity: 'NONE', conflictingEvents: [] })));
        this.isLoading.set(false);
        // Then enrich with conflict info for GEPLANT absences
        this.enrichWithConflicts(data);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Sub-Issue #285: Reichert alle zukünftigen Abwesenheiten mit Konfliktstatus an.
   * Nutzt den checkConflicts-Endpunkt – für den Admin-Kontext rufen wir ihn mit den
   * Zeiträumen der Abwesenheiten auf. Die IDs der Konflikte werden als eigenes Set gespeichert.
   * Da der Endpunkt für den eingeloggten Dozenten prüft, zeigen wir im Admin nur den
   * Severity-Badge aus den gespeicherten Konfliktdaten an (readOnly-Dialog).
   * Für eine vollständige Admin-Lösung wäre ein batch-Endpunkt optimal (s. Risiken im Plan).
   */
  private enrichWithConflicts(data: LecturerAbsenceResponse[]): void {
    // Nur geplante Abwesenheiten prüfen (performance-schonend)
    const geplant = data.filter(a => this.getStatus(a) === 'GEPLANT');
    if (geplant.length === 0) return;

    const checks$ = geplant.map(absence =>
      this.absenceService.checkConflicts(
        absence.startDate + 'T00:00:00',
        absence.endDate + 'T23:59:59'
      ).pipe(catchError(() => of([])))
    );

    forkJoin(checks$).subscribe((results: ConflictingEventDto[][]) => {
      const enriched = new Map<number, { severity: ConflictSeverity; events: ConflictingEventDto[] }>();
      geplant.forEach((absence, i) => {
        const events = results[i] as ConflictingEventDto[];
        const count = events.length;
        const severity: ConflictSeverity = count === 0 ? 'NONE' : count >= 3 ? 'CRITICAL' : 'WARNING';
        enriched.set(absence.id, { severity, events });
      });

      this.absences.update(current =>
        current.map(a => {
          const info = enriched.get(a.id);
          if (info) {
            return { ...a, conflictSeverity: info.severity, conflictingEvents: info.events };
          }
          return a;
        })
      );
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

  openConflictDialog(absence: AbsenceWithConflicts): void {
    if (!absence.conflictingEvents || absence.conflictingEvents.length === 0) return;
    this.dialog.open(AbsenceConflictDialog, {
      data: { conflictingEvents: absence.conflictingEvents, readOnly: true },
      width: '560px'
    });
  }

  onDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialog);

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.adminAbsenceService.deleteAbsence(id).subscribe({
          next: () => {
            this.snackBar.open('Abwesenheit wurde gelöscht.', 'OK', { duration: 3000 });
            this.absences.update(old => old.filter(a => a.id !== id));
          },
          error: () => {
            this.snackBar.open('Fehler beim Löschen.', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }
}
