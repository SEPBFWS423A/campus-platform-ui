import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { AdminService, Room, RoomUtilizationData, RoomStatusHistory } from '../admin.service';
import { RoomEditDialog } from './room-edit.dialog/room-edit.dialog';
import { RoomDeleteDialog } from './room-delete.dialog/room-delete.dialog';
import { RoomSchedule } from './room-schedule/room-schedule';
import { RoomUtilization } from './room-utilization/room-utilization';
import { RoomBlockoutComponent } from './room-blockout/room-blockout';
import { OperationalStatusPipe } from '../../../shared/pipes/operational-status.pipe';

@Component({
  selector: 'app-room-management',
  standalone: true,
  imports: [
    CommonModule,
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
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule,
    OperationalStatusPipe,
    RoomSchedule,
    RoomUtilization,
    RoomBlockoutComponent,
  ],
  templateUrl: './room-management.html',
  styleUrl: './room-management.scss',
})
export class RoomManagement implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  rooms = signal<Room[]>([]);
  createError = signal<string | null>(null);

  displayedColumns: string[] = ['name', 'seats', 'type', 'building', 'status', 'actions'];
  
  // Tab Management
  focusedRoomId = signal<number | null>(null);
  selectedTabIndex = signal(0);
  expandedElement = signal<Room | null>(null);
  roomHistory = signal<RoomStatusHistory[]>([]);
  utilizationData = signal<RoomUtilizationData[]>([]);

  // Filters
  filterRoomId = signal<number | null>(null);
  filterStart = signal<Date>(new Date());
  filterEnd = signal<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  
  roomAutocompleteControl = new FormControl('');
  
  filteredAutocompleteOptions = toSignal(
    this.roomAutocompleteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterRooms(value || ''))
    ),
    { initialValue: [] as Room[] }
  );

  filteredRooms = computed(() => {
    let list = this.rooms();
    const id = this.filterRoomId();
    if (id) {
      list = list.filter(r => r.id === id);
    }
    return list;
  });

  // Stats
  totalRooms = computed(() => this.rooms().length);
  totalSeats = computed(() => this.rooms().reduce((acc, r) => acc + (r.seats || 0), 0));
  totalUtilization = computed(() => {
    const data = this.utilizationData();
    if (data.length === 0) return '0%';
    const avg = data.reduce((acc, u) => acc + u.utilizationPercent, 0) / data.length;
    return Math.round(avg) + '%';
  });

  constructor() {
    effect(() => {
      const room = this.expandedElement();
      if (room) {
        this.loadHistory(room.id);
      }
    });

    effect(() => {
      this.loadUtilization();
    });
  }

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.adminService.getRooms().subscribe(rooms => {
      this.rooms.set(rooms);
    });
  }

  private _filterRooms(value: string): Room[] {
    const filterValue = value.toLowerCase();
    return this.rooms().filter(room => 
      room.name.toLowerCase().includes(filterValue) || 
      room.building.toLowerCase().includes(filterValue)
    );
  }

  onRoomSelected(roomId: number) {
    this.filterRoomId.set(roomId);
  }

  onFocusRoom(roomId: number) {
    this.focusedRoomId.set(roomId);
    this.selectedTabIndex.set(1); // Set to "Belegungsplan" tab
  }

  onResetFilters() {
    this.filterRoomId.set(null);
    this.roomAutocompleteControl.setValue('');
    this.filterStart.set(new Date());
    this.filterEnd.set(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }

  onCreateRoom() {
    if (this.createForm.invalid) return;

    this.adminService.createRoom(this.createForm.value as any).subscribe({
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

  loadHistory(roomId: number) {
    this.adminService.getRoomStatusHistory(roomId).subscribe(history => {
      this.roomHistory.set(history);
    });
  }

  loadUtilization() {
    const start = this.filterStart();
    const end = this.filterEnd();
    if (start && end) {
      const s = this.toLocalIsoDate(start);
      const e = this.toLocalIsoDate(end);
      this.adminService.getRoomUtilizations(s, e).subscribe(data => {
        this.utilizationData.set(data);
      });
    }
  }

  private toLocalIsoDate(date: Date): string {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate());
  }

  createForm = this.fb.group({
    name: ['', Validators.required],
    seats: [0, [Validators.required, Validators.min(0)]],
    examSeats: [0, [Validators.required, Validators.min(0)]],
    roomType: ['HOERSAAL', Validators.required],
    building: ['', Validators.required],
    floor: [0],
    barrierefreiheit: [false],
    description: [''],
    operationalStatus: ['AKTIV', Validators.required]
  });
}
