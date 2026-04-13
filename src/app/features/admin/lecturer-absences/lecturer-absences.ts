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

import { LecturerAbsenceResponse } from '../../lecturer/models/lecturer.models';
import { AdminAbsenceService } from '../services/admin-absence.service';
import { ConfirmDialog } from '../../lecturer/absences/absences';

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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  absences = signal<LecturerAbsenceResponse[]>([]);
  isLoading = signal(false);

  lecturers = computed(() => {
    const abs = this.absences();
    const names = new Set(abs.map(a => a.lecturerName).filter(Boolean));
    return Array.from(names).sort();
  });

  lecturerFilter = new FormControl<string>('ALL');

  displayedColumns = ['lecturer', 'status', 'type', 'startDate', 'endDate', 'note', 'actions'];

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
