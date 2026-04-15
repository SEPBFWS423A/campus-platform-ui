import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { SocialService, StudentEventCategory, CommunityEventResponse } from '../../social.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-social-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatNativeDateModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './social-event-dialog.html',
  styleUrl: './social-event-dialog.scss'
})
export class SocialEventDialog implements OnInit {
  private fb = inject(FormBuilder);
  private socialService = inject(SocialService);
  private dialogRef = inject(MatDialogRef<SocialEventDialog>);
  data = inject(MAT_DIALOG_DATA);

  eventForm: FormGroup;
  isEdit = false;
  categories = Object.values(StudentEventCategory);
  rooms = signal<any[]>([]);
  useCampusRoom = signal(false);

  constructor() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      category: [StudentEventCategory.SOCIAL, Validators.required],
      startDate: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      roomId: [null],
      customLocation: ['']
    }, { validators: this.timeRangeValidator() });
  }

  timeRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get('startTime')?.value;
      const endControl = group.get('endTime');
      const end = endControl?.value;
      
      if (start && end && end <= start) {
        endControl?.setErrors({ ...endControl.errors, timeRangeInvalid: true });
        return { timeRangeInvalid: true };
      } else if (endControl?.hasError('timeRangeInvalid')) {
        const errors = { ...endControl.errors };
        delete errors['timeRangeInvalid'];
        endControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      
      return null;
    };
  }

  ngOnInit(): void {
    this.setupDateAndTimeWatchers();
    
    if (this.data?.event) {
      this.isEdit = true;
      const event = this.data.event as CommunityEventResponse;
      this.eventForm.patchValue({
        title: event.title,
        description: event.description,
        category: event.category,
        startDate: event.startTime ? new Date(event.startTime) : null,
        startTime: event.startTime ? event.startTime.split('T')[1].substring(0, 5) : '',
        endTime: event.endTime ? event.endTime.split('T')[1].substring(0, 5) : '',
        roomId: event.roomId,
        customLocation: event.customLocation
      });
      if (event.roomId) this.useCampusRoom.set(true);
    }
    
    // Initial fetch if we have values
    this.updateAvailableRooms();
  }

  private setupDateAndTimeWatchers(): void {
    const controls = ['startDate', 'startTime', 'endTime'];
    controls.forEach(control => {
      this.eventForm.get(control)?.valueChanges.subscribe(() => {
        this.updateAvailableRooms();
      });
    });
  }

  private updateAvailableRooms(): void {
    const form = this.eventForm.value;
    // We check for valid date and times, and no range errors
    if (form.startDate && form.startTime && form.endTime && !this.eventForm.get('endTime')?.hasError('timeRangeInvalid')) {
      const startIso = this.formatLocalDateTime(form.startDate, form.startTime);
      const endIso = this.formatLocalDateTime(form.startDate, form.endTime);
      
      this.socialService.getRooms(startIso, endIso, this.data?.event?.id).subscribe(rooms => {
        this.rooms.set(rooms);
        
        // If the currently selected room is no longer in the list, reset it
        if (form.roomId && !rooms.some(r => r.id === form.roomId)) {
          this.eventForm.get('roomId')?.setValue(null);
        }
      });
    } else {
      this.rooms.set([]);
    }
  }


  onToggleLocation(event: any): void {
    this.useCampusRoom.set(event.checked);
    if (event.checked) {
      this.eventForm.get('customLocation')?.setValue('');
    } else {
      this.eventForm.get('roomId')?.setValue(null);
    }
  }

  private formatLocalDateTime(dateInput: any, timeInput: string): string {
    if (!dateInput || !timeInput) return '';
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    
    const [hours, minutes] = timeInput.split(':').map(Number);
    d.setHours(hours, minutes);
    
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 19);
    return localISOTime;
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;
      const request = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        roomId: formValue.roomId,
        customLocation: formValue.customLocation,
        startTime: this.formatLocalDateTime(formValue.startDate, formValue.startTime),
        endTime: this.formatLocalDateTime(formValue.startDate, formValue.endTime)
      };

      const obs = this.isEdit 
        ? this.socialService.updateEvent(this.data.event.id, request)
        : this.socialService.createEvent(request);

      obs.subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => {
          // Error handling (e.g. snackbar for collision)
          console.error(err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
