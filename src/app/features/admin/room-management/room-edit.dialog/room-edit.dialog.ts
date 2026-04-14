import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OperationalStatus, Room, RoomType } from '../../admin.service';

@Component({
  selector: 'app-room-edit-dialog',
  templateUrl: './room-edit.dialog.html',
  styleUrl: './room-edit.dialog.scss',
  imports: [
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule
  ],
})
export class RoomEditDialog implements OnInit {
  private fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<RoomEditDialog>);
  readonly data: Room = inject(MAT_DIALOG_DATA);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.name, [Validators.required, Validators.maxLength(50)]],
      seats: [this.data.seats, [Validators.required, Validators.min(1)]],
      examSeats: [this.data.examSeats, [Validators.required, Validators.min(0)]],
      building: [this.data.building || '', Validators.required],
      floor: [this.data.floor || 0],
      roomType: [this.data.roomType || 'SEMINARRAUM', Validators.required],
      operationalStatus: [this.data.operationalStatus || 'AKTIV', Validators.required],
      features: [this.data.features || []],
      barrierefreiheit: [this.data.barrierefreiheit || false],
      description: [this.data.description || '', Validators.maxLength(500)],
    }, { validators: this.examSeatsValidator });
  }

  private examSeatsValidator(g: FormGroup) {
    const seats = g.get('seats')?.value;
    const examSeats = g.get('examSeats')?.value;
    if (examSeats !== null && seats !== null && examSeats > seats) {
      g.get('examSeats')?.setErrors({ examSeatsExceedsSeats: true });
    } else if (g.get('examSeats')?.hasError('examSeatsExceedsSeats')) {
      const errors = { ...g.get('examSeats')?.errors };
      delete errors['examSeatsExceedsSeats'];
      g.get('examSeats')?.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
