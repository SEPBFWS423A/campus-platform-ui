import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-auto-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './auto-schedule-dialog.html',
  styleUrl: './auto-schedule-dialog.scss'
})
export class AutoScheduleDialog implements OnInit {
  scheduleForm: FormGroup;

  defaultSlots = [
    { startTime: '09:45', endTime: '13:00' },
    { startTime: '13:45', endTime: '17:00' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AutoScheduleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { seriesId: number }
  ) {
    const startDate = this.getDefaultStartDate();
    this.scheduleForm = this.fb.group({
      startDate: [startDate, Validators.required],
      endDate: [this.getDefaultEndDate(startDate), Validators.required],
      timeSlots: this.fb.array([])
    }, { validators: this.dateRangeValidator() });
  }

  dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get('startDate')?.value;
      const end = group.get('endDate')?.value;
      return start && end && end < start ? { dateRangeInvalid: true } : null;
    };
  }

  ngOnInit(): void {
    this.initializeSlots();
  }

  getDefaultStartDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (1 + 7 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  getDefaultEndDate(startDate: Date): Date {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 3);
    return d;
  }

  get timeSlots(): FormArray {
    return this.scheduleForm.get('timeSlots') as FormArray;
  }

  initializeSlots(): void {
    this.defaultSlots.forEach(slot => {
      this.addSlot(slot.startTime, slot.endTime);
    });
  }

  addSlot(startTime: string = '08:00', endTime: string = '13:00'): void {
    this.timeSlots.push(this.fb.group({
      startTime: [startTime, Validators.required],
      endTime: [endTime, Validators.required]
    }));
  }

  removeSlot(index: number): void {
    this.timeSlots.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      this.dialogRef.close(this.scheduleForm.value);
    }
  }
}
