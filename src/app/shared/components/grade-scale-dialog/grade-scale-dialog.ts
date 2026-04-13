import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface GradeScaleEntry {
  grade: number;
  minimumPoints: number;
  label?: string;
}

@Component({
  selector: 'app-grade-scale-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './grade-scale-dialog.html',
  styleUrl: './grade-scale-dialog.scss',
})
export class GradeScaleDialog {
  constructor(
    public dialogRef: MatDialogRef<GradeScaleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { entries: GradeScaleEntry[] }
  ) { }

  onClose(): void {
    this.dialogRef.close();
  }
}
