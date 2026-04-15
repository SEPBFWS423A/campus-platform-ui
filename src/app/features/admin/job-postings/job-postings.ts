import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { JobPostingService } from '../services/job-posting.service';

// ─── Modelle (auch vom HTTP-Service genutzt) ──────────────────────────────────

export type JobStatus = 'ENTWURF' | 'AKTIV' | 'GESCHLOSSEN' | 'ARCHIVIERT';
export type JobType = 'VOLLZEIT' | 'TEILZEIT' | 'LEHRAUFTRAG' | 'STUDENTISCHE_HILFSKRAFT' | 'PRAKTIKUM';

export interface JobPosting {
  id: number;
  title: string;
  department: string;
  type: JobType;
  status: JobStatus;
  description: string;
  requirements?: string;
  deadline: string;
  createdAt: string;
  applicationCount: number;
  autoPublish: boolean;
  createdBy?: string;
}

export interface JobPostingRequest {
  title: string;
  department: string;
  type: JobType;
  description: string;
  requirements?: string;
  deadline: string;
  autoPublish: boolean;
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-job-posting-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule, MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>{{ data ? 'edit' : 'add_circle' }}</mat-icon>
      {{ data ? 'Ausschreibung bearbeiten' : 'Neue Ausschreibung erstellen' }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="posting-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-field" subscriptSizing="dynamic">
            <mat-label>Stellentitel</mat-label>
            <input matInput formControlName="title" placeholder="z.B. Dozent für Informatik">
            <mat-icon matPrefix>work</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-field" subscriptSizing="dynamic">
            <mat-label>Fachbereich / Abteilung</mat-label>
            <input matInput formControlName="department" placeholder="z.B. Informatik">
            <mat-icon matPrefix>business</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-field" subscriptSizing="dynamic">
            <mat-label>Stellenart</mat-label>
            <mat-select formControlName="type">
              <mat-option value="VOLLZEIT">Vollzeit</mat-option>
              <mat-option value="TEILZEIT">Teilzeit</mat-option>
              <mat-option value="LEHRAUFTRAG">Lehrauftrag</mat-option>
              <mat-option value="STUDENTISCHE_HILFSKRAFT">Studentische Hilfskraft</mat-option>
              <mat-option value="PRAKTIKUM">Praktikum</mat-option>
            </mat-select>
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-field" subscriptSizing="dynamic">
            <mat-label>Bewerbungsfrist</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="deadline">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Stellenbeschreibung</mat-label>
          <textarea matInput formControlName="description" rows="4"
                    placeholder="Aufgaben, Verantwortlichkeiten, Einblick in die Stelle…"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Anforderungen</mat-label>
          <textarea matInput formControlName="requirements" rows="3"
                    placeholder="Qualifikationen, Kenntnisse, Erfahrungen…"></textarea>
        </mat-form-field>

        <div class="auto-publish-row">
          <mat-slide-toggle formControlName="autoPublish" color="primary" id="auto-publish-toggle">
            Auf öffentlicher Stellenseite anzeigen
          </mat-slide-toggle>
          <span class="auto-hint">
            <mat-icon>open_in_new</mat-icon>
            Sichtbar unter <strong>/jobs</strong> für alle Besucher
          </span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()" id="save-posting-btn">
        <mat-icon>save</mat-icon>
        {{ data ? 'Speichern' : 'Erstellen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 600; }
    .dialog-content { min-width: 560px; max-width: 700px; padding-top: 8px; }
    .posting-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .flex-field { flex: 1; }
    .full-width { width: 100%; }
    .auto-publish-row {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-radius: 8px;
      background-color: var(--mat-sys-surface-container-low, rgba(0,0,0,0.03));
    }
    .auto-hint {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--mat-sys-on-surface-variant);
    }
    .auto-hint mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `]
})
export class JobPostingFormDialog {
  readonly dialogRef = inject(MatDialogRef<JobPostingFormDialog>);
  readonly data: JobPosting | null = inject(MAT_DIALOG_DATA);

  private toDateString(val: any): string {
    if (!val) return '';
    if (val instanceof Date) {
      // Use local date parts to avoid UTC timezone shift
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Already a string like "2026-05-31" — return as-is
    return String(val).split('T')[0];
  }

  private parseDeadline(val: string | null | undefined): Date | string {
    if (!val) return '';
    // Parse "2026-05-31" without timezone shift by using explicit year/month/day
    const parts = val.split('-');
    if (parts.length === 3) {
      return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
    return val;
  }

  form = new FormGroup({
    title:        new FormControl(this.data?.title ?? '', Validators.required),
    department:   new FormControl(this.data?.department ?? '', Validators.required),
    type:         new FormControl<JobType>(this.data?.type ?? 'VOLLZEIT', Validators.required),
    deadline:     new FormControl<Date | string>(this.parseDeadline(this.data?.deadline), Validators.required),
    description:  new FormControl(this.data?.description ?? '', Validators.required),
    requirements: new FormControl(this.data?.requirements ?? ''),
    autoPublish:  new FormControl(this.data ? this.data.status === 'AKTIV' : true)
  });

  submit(): void {
    if (this.form.valid) {
      const v = this.form.value;
      const req: JobPostingRequest = {
        title:        v.title!,
        department:   v.department!,
        type:         v.type as JobType,
        description:  v.description!,
        requirements: v.requirements ?? undefined,
        deadline:     this.toDateString(v.deadline),
        autoPublish:  v.autoPublish ?? true
      };
      this.dialogRef.close(req);
    }
  }
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

@Component({
  selector: 'app-job-postings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule, MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './job-postings.html',
  styleUrl: './job-postings.scss'
})
export class JobPostings implements OnInit {
  private readonly dialog  = inject(MatDialog);
  private readonly snack   = inject(MatSnackBar);
  private readonly svc     = inject(JobPostingService);

  postings  = signal<JobPosting[]>([]);
  loading   = signal(true);
  error     = signal<string | null>(null);

  filterStatus = new FormControl<string>('ALL');
  filterType   = new FormControl<string>('ALL');

  filteredPostings = computed(() => {
    const s = this.filterStatus.value;
    const t = this.filterType.value;
    return this.postings().filter(p =>
      (!s || s === 'ALL' || p.status === s) &&
      (!t || t === 'ALL' || p.type === t)
    );
  });

  displayedColumns = ['title', 'department', 'type', 'deadline', 'status', 'applications', 'actions'];

  statusOptions = [
    { value: 'ALL',         label: 'Alle Status' },
    { value: 'ENTWURF',     label: 'Entwurf' },
    { value: 'AKTIV',       label: 'Aktiv' },
    { value: 'GESCHLOSSEN', label: 'Geschlossen' },
    { value: 'ARCHIVIERT',  label: 'Archiviert' }
  ];

  typeOptions = [
    { value: 'ALL',                     label: 'Alle Arten' },
    { value: 'VOLLZEIT',                label: 'Vollzeit' },
    { value: 'TEILZEIT',                label: 'Teilzeit' },
    { value: 'LEHRAUFTRAG',             label: 'Lehrauftrag' },
    { value: 'STUDENTISCHE_HILFSKRAFT', label: 'Stud. Hilfskraft' },
    { value: 'PRAKTIKUM',               label: 'Praktikum' }
  ];

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().subscribe({
      next: data  => { this.postings.set(data); this.loading.set(false); },
      error: _err => { this.error.set('Ausschreibungen konnten nicht geladen werden.'); this.loading.set(false); }
    });
  }

  openCreateDialog(): void {
    this.dialog.open(JobPostingFormDialog, { data: null, width: '740px' })
      .afterClosed().subscribe((req: JobPostingRequest | undefined) => {
        if (!req) return;
        this.svc.create(req).subscribe({
          next: created => {
            this.postings.update(old => [created, ...old]);
            this.snack.open(
              req.autoPublish ? 'Ausschreibung erstellt und veröffentlicht.' : 'Entwurf gespeichert.',
              'OK', { duration: 3000 });
          },
          error: () => this.snack.open('Fehler beim Erstellen.', 'OK', { duration: 3000 })
        });
      });
  }

  openEditDialog(posting: JobPosting): void {
    this.dialog.open(JobPostingFormDialog, { data: posting, width: '740px' })
      .afterClosed().subscribe((req: JobPostingRequest | undefined) => {
        if (!req) return;
        this.svc.update(posting.id, req).subscribe({
          next: updated => {
            this.postings.update(old => old.map(p => p.id === posting.id ? updated : p));
            this.snack.open('Ausschreibung aktualisiert.', 'OK', { duration: 3000 });
          },
          error: () => this.snack.open('Fehler beim Aktualisieren.', 'OK', { duration: 3000 })
        });
      });
  }

  toggleStatus(posting: JobPosting): void {
    const next: JobStatus = posting.status === 'AKTIV' ? 'GESCHLOSSEN' : 'AKTIV';
    this.svc.setStatus(posting.id, next).subscribe({
      next: updated => {
        this.postings.update(old => old.map(p => p.id === posting.id ? updated : p));
        this.snack.open(
          next === 'AKTIV' ? 'Ausschreibung reaktiviert.' : 'Ausschreibung geschlossen.',
          'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Fehler beim Statuswechsel.', 'OK', { duration: 3000 })
    });
  }

  deletePosting(id: number): void {
    this.svc.delete(id).subscribe({
      next: () => {
        this.postings.update(old => old.filter(p => p.id !== id));
        this.snack.open('Ausschreibung gelöscht.', 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Fehler beim Löschen.', 'OK', { duration: 3000 })
    });
  }

  getStatusClass(status: JobStatus): string {
    const map: Record<JobStatus, string> = {
      ENTWURF:    'status-entwurf',
      AKTIV:      'status-aktiv',
      GESCHLOSSEN:'status-geschlossen',
      ARCHIVIERT: 'status-archiviert'
    };
    return map[status] ?? '';
  }

  getTypeLabel(type: JobType): string {
    const map: Record<JobType, string> = {
      VOLLZEIT:               'Vollzeit',
      TEILZEIT:               'Teilzeit',
      LEHRAUFTRAG:            'Lehrauftrag',
      STUDENTISCHE_HILFSKRAFT:'Stud. Hilfskraft',
      PRAKTIKUM:              'Praktikum'
    };
    return map[type] ?? type;
  }

  totalActive       = computed(() => this.postings().filter(p => p.status === 'AKTIV').length);
  totalApplications = computed(() => this.postings().reduce((s, p) => s + p.applicationCount, 0));
}
