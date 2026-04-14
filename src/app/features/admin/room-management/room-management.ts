import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AdminService, Room, RoomUtilizationData } from '../admin.service';
import { RoomEditDialog } from './room-edit.dialog/room-edit.dialog';
import { RoomDeleteDialog } from './room-delete.dialog/room-delete.dialog';
import { RoomSchedule } from './room-schedule/room-schedule';
import { RoomUtilization } from './room-utilization/room-utilization';
import { MatChipsModule } from '@angular/material/chips';
import { OperationalStatusPipe } from '../../../shared/pipes/operational-status.pipe';

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
    MatExpansionModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDialogModule,
    OperationalStatusPipe,
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
  focusedRoomId = signal<number | null>(null);
  selectedTabIndex = signal(0);
  expandedElement = signal<Room | null>(null);

  // Filters
  filterRoomId = signal<number | null>(null);
  filterStart = signal<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  filterEnd = signal<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  filteredRooms = computed(() => {
    let list = this.rooms();
    const rid = this.filterRoomId();
    if (rid) {
      list = list.filter(r => r.id === rid);
    }
    return list;
  });

  roomAutocompleteControl = new FormControl('');
  filteredAutocompleteOptions = computed(() => {
    const val = this.roomAutocompleteControl.value?.toLowerCase() || '';
    return this.rooms().filter(r => r.name.toLowerCase().includes(val));
  });

  totalRooms = computed(() => this.rooms().length);
  totalSeats = computed(() => this.rooms().reduce((s, r) => s + r.seats, 0));
  totalUtilization = computed(() => {
    const data = this.utilizationData();
    if (!data || data.length === 0) return '0%';
    const avg = data.reduce((sum, r) => sum + r.utilizationPercent, 0) / data.length;
    return `${Math.round(avg)}%`;
  });

  displayedColumns = ['name', 'status', 'seats', 'examSeats', 'actions'];

  createError = signal<string | null>(null);
  createForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    seats: [null, [Validators.required, Validators.min(1)]],
    examSeats: [null, [Validators.required, Validators.min(0)]],
    building: ['', Validators.required],
    floor: [0],
    roomType: ['HOERSAAL', Validators.required],
    operationalStatus: ['AKTIV', Validators.required],
    features: [[]],
    barrierefreiheit: [false],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit() {
    this.loadRooms();
    this.loadUtilization();
  }

  loadRooms() {
    this.adminService.getRooms().subscribe(rooms => {
      this.rooms.set(rooms);
    });
  }

  loadUtilization() {
    const start = this.filterStart()?.toISOString().split('T')[0] || '';
    const end = this.filterEnd()?.toISOString().split('T')[0] || '';
    this.adminService.getRoomUtilizations(start, end).subscribe(data => {
      this.utilizationData.set(data);
    });
  }

  onResetFilters() {
    this.filterRoomId.set(null);
    this.roomAutocompleteControl.setValue('');
    this.filterStart.set(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    this.filterEnd.set(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
    this.loadUtilization();
  }

  onRoomSelected(roomId: number) {
    this.filterRoomId.set(roomId);
  }

  onFocusRoom(roomId: number) {
    this.focusedRoomId.set(roomId);
    this.selectedTabIndex.set(1);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onCreateRoom() {
    if (this.createForm.invalid) return;

    this.adminService.createRoom(this.createForm.value).subscribe({
      next: () => {
        this.loadRooms();
        this.createForm.reset({
          roomType: 'HOERSAAL',
          operationalStatus: 'AKTIV',
          floor: 0,
          barrierefreiheit: false
        });
        this.createError.set(null);
      },
      error: (err) => {
        this.createError.set('Raum konnte nicht erstellt werden. ' + (err.error?.message || ''));
      }
    });
  }

  onEditRoom(roomId: number) {
    const room = this.rooms().find(r => r.id === roomId);
    if (!room) return;

    const dialogRef = this.dialog.open(RoomEditDialog, {
      width: '600px',
      data: room,
      panelClass: 'glass-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRooms();
      }
    });
  }

  onDeleteRoom(roomId: number) {
    const room = this.rooms().find(r => r.id === roomId);
    if (!room) return;

    const dialogRef = this.dialog.open(RoomDeleteDialog, {
      width: '400px',
      data: room
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteRoom(roomId).subscribe(() => {
          this.loadRooms();
        });
      }
    });
  }
}
