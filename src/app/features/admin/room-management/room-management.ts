import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

interface Room {
  id: number;
  name: string;
  seats: number;
  examSeats: number;
  bookings: number;
}

interface RoomUtilization {
  roomName: string;
  percent: number;
  hours: number;
}

@Component({
  selector: 'app-room-management',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './room-management.html',
  styleUrl: './room-management.scss',
})
export class RoomManagement {
  rooms: Room[] = [
    { id: 9, name: 'Audimax', seats: 500, examSeats: 250, bookings: 0 },
    { id: 1, name: 'Hörsaal 1', seats: 200, examSeats: 100, bookings: 1 },
    { id: 2, name: 'Hörsaal 2', seats: 150, examSeats: 75, bookings: 1 },
    { id: 3, name: 'M-208', seats: 23, examSeats: 7, bookings: 0 },
    { id: 5, name: 'PC-Labor 1', seats: 25, examSeats: 25, bookings: 1 },
    { id: 6, name: 'R 1.02', seats: 40, examSeats: 20, bookings: 1 },
    { id: 7, name: 'R 1.04', seats: 30, examSeats: 15, bookings: 1 },
    { id: 4, name: 'R 2.05', seats: 35, examSeats: 18, bookings: 2 },
    { id: 8, name: 'R 2.10', seats: 45, examSeats: 22, bookings: 2 },
  ];

  displayedColumns = ['name', 'seats', 'examSeats', 'bookings', 'actions'];

  get totalRooms(): number {
    return this.rooms.length;
  }

  get totalSeats(): number {
    return this.rooms.reduce((sum, r) => sum + r.seats, 0);
  }

  get totalUtilization(): string {
    return '5.5%';
  }

  selectedRoomId = signal<number>(9);

  scheduleWeekLabel = 'KW 12 (23.03 – 27.03)';
  scheduleHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  scheduleDays = [
    { label: 'Mo 23.03' },
    { label: 'Di 24.03' },
    { label: 'Mi 25.03' },
    { label: 'Do 26.03' },
    { label: 'Fr 27.03' },
  ];

  utilization: RoomUtilization[] = [
    { roomName: 'Audimax', percent: 0.0, hours: 0.0 },
    { roomName: 'Hörsaal 1', percent: 7.2, hours: 3.3 },
    { roomName: 'Hörsaal 2', percent: 3.3, hours: 1.5 },
    { roomName: 'M-208', percent: 0.0, hours: 0.0 },
    { roomName: 'PC-Labor 1', percent: 7.2, hours: 3.3 },
    { roomName: 'R 1.02', percent: 3.3, hours: 1.5 },
    { roomName: 'R 1.04', percent: 7.2, hours: 3.3 },
    { roomName: 'R 2.05', percent: 6.7, hours: 3.0 },
    { roomName: 'R 2.10', percent: 14.4, hours: 6.5 },
  ];

  createError = signal<string | null>(null);
  createForm: FormGroup;
  utilForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      seats: [null, [Validators.required, Validators.min(0)]],
      examSeats: [null, [Validators.required, Validators.min(0)]],
    });
    this.utilForm = this.fb.group({
      startDate: ['2026-03-23'],
      endDate: ['2026-03-27'],
    });
  }

  onCreateRoom(): void {
    if (this.createForm.valid) {
      // TODO: call service to create room
      this.createForm.reset();
    }
  }

  onEditRoom(_id: number): void {
    // TODO: open edit dialog
  }

  onDeleteRoom(_id: number): void {
    // TODO: open confirmation dialog and delete
  }

  onPrevWeek(): void {
    // TODO: navigate to previous week
  }

  onNextWeek(): void {
    // TODO: navigate to next week
  }

  onLoadUtilization(): void {
    // TODO: load utilization for selected date range
  }
}
