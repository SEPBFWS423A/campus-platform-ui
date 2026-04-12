import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService, Room, RoomUtilizationData } from '../admin.service';
import { RoomEditDialog } from './room-edit.dialog/room-edit.dialog';
import { RoomDeleteDialog } from './room-delete.dialog/room-delete.dialog';
import { RoomSchedule } from './room-schedule/room-schedule';
import { RoomUtilization } from './room-utilization/room-utilization';

@Component({
  selector: 'app-room-management',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    RoomSchedule,
    RoomUtilization,
  ],
  templateUrl: './room-management.html',
  styleUrl: './room-management.scss',
})
export class RoomManagement implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  rooms = signal<Room[]>([]);
  utilizationData = signal<RoomUtilizationData[]>([]);
  totalRooms = computed(() => this.rooms().length);
  totalSeats = computed(() => this.rooms().reduce((s, r) => s + r.seats, 0));
  totalUtilization = computed(() => {
    const data = this.utilizationData();
    if (!data || data.length === 0) return '0%';
    const avg = data.reduce((sum, r) => sum + r.utilizationPercent, 0) / data.length;
    return `${Math.round(avg)}%`;
  });

  displayedColumns = ['name', 'seats', 'examSeats', 'actions'];

  createError = signal<string | null>(null);
  createForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    seats: [null, [Validators.required, Validators.min(0)]],
    examSeats: [null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadRooms();
    this.loadTotalUtilization();
  }

  onCreateRoom(): void {
    if (this.createForm.invalid) return;
    this.createError.set(null);
    this.adminService.createRoom(this.createForm.value).subscribe({
      next: (room) => {
        this.rooms.update(rooms => [...rooms, room]);
        this.createForm.reset();
      },
      error: () => this.createError.set('Raum konnte nicht angelegt werden.'),
    });
  }

  onEditRoom(id: number): void {
    const room = this.rooms().find(r => r.id === id);
    if (!room) return;

    this.dialog.open(RoomEditDialog, { data: room, width: '560px', maxHeight: '95vh' })
      .afterClosed()
      .subscribe(result => {
        if (!result) return;
        this.adminService.updateRoom(id, result).subscribe({
          next: (updated) => {
            this.rooms.update(rooms => rooms.map(r => r.id === id ? updated : r));
          },
          error: () => this.createError.set('Raum konnte nicht aktualisiert werden.'),
        });
      });
  }

  onDeleteRoom(id: number): void {
    const room = this.rooms().find(r => r.id === id);
    if (!room) return;

    this.dialog.open(RoomDeleteDialog, { data: room, width: '400px' })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.adminService.deleteRoom(id).subscribe({
          next: () => {
            this.rooms.update(rooms => rooms.filter(r => r.id !== id));
          },
          error: () => this.createError.set('Raum konnte nicht gelöscht werden.'),
        });
      });
  }

  private loadRooms(): void {
    this.adminService.getRooms().subscribe({
      next: (rooms) => { this.rooms.set(rooms); },
      error: () => this.createError.set('Räume konnten nicht geladen werden.'),
    });
  }

  private loadTotalUtilization(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startStr = this.toLocalIsoDate(start);
    const endStr   = this.toLocalIsoDate(end);
    
    this.adminService.getRoomUtilizations(startStr, endStr).subscribe(data => this.utilizationData.set(data));
  }

  private toLocalIsoDate(date: Date): string {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate());
  }
}
