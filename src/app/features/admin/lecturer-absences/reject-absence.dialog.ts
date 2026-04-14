import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reject-absence-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="reject-title">
      <mat-icon class="reject-icon">cancel</mat-icon>
      Abwesenheit ablehnen
    </h2>

    <mat-dialog-content class="reject-content">
      <p class="reject-intro">
        Bitte geben Sie eine Begründung an. Diese wird dem Dozenten angezeigt.
      </p>
      <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
        <mat-label>Begründung</mat-label>
        <textarea matInput [formControl]="reasonCtrl" rows="4"
                  placeholder="Warum wird die Abwesenheit abgelehnt?"></textarea>
        <mat-error *ngIf="reasonCtrl.invalid">Begründung ist erforderlich.</mat-error>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Abbrechen</button>
      <button mat-flat-button color="warn"
              [disabled]="reasonCtrl.invalid"
              (click)="submit()">
        <mat-icon>block</mat-icon>
        Ablehnen
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .reject-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
    }
    .reject-icon { color: var(--mat-sys-error); }
    .reject-content { min-width: 360px; max-width: 480px; }
    .reject-intro {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 16px 0;
    }
    .full-width { width: 100%; }
  `]
})
export class RejectAbsenceDialog {
  readonly dialogRef = inject(MatDialogRef<RejectAbsenceDialog>);
  readonly reasonCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  submit(): void {
    if (this.reasonCtrl.valid) {
      this.dialogRef.close(this.reasonCtrl.value);
    }
  }
}
