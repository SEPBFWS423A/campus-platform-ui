import { Component, OnInit, signal } from '@angular/core';
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
import { AdminService, Room } from '../admin.service';

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
export class RoomManagement implements OnInit {
  rooms: Room[] = [];

  displayedColumns = ['name', 'seats', 'examSeats', 'actions'];

  get totalRooms(): number {
    return this.rooms.length;
  }

  get totalSeats(): number {
    return this.rooms.reduce((sum, r) => sum + r.seats, 0);
  }

  get totalUtilization(): string {
    return '0%';
  }

  selectedRoomId = signal<number | null>(null);

  scheduleWeekLabel = 'KW 12 (23.03 – 27.03)';
  scheduleHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  scheduleDays = [
    { label: 'Mo 23.03' },
    { label: 'Di 24.03' },
    { label: 'Mi 25.03' },
    { label: 'Do 26.03' },
    { label: 'Fr 27.03' },
  ];

  utilization: RoomUtilization[] = [];

  createError = signal<string | null>(null);
  createForm: FormGroup;
  utilForm: FormGroup;

  constructor(private fb: FormBuilder, private adminService: AdminService) {
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

  ngOnInit(): void {
    this.adminService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        if (rooms.length > 0) {
          this.selectedRoomId.set(rooms[0].id);
        }
      },
      error: () => {
        this.createError.set('Räume konnten nicht geladen werden.');
      },
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
