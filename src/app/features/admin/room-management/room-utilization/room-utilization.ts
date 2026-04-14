import { Component, computed, input, signal, inject, OnInit, effect } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { Room, AdminService, RoomUtilizationData, RoomScheduleEvent } from '../../admin.service';
import { OperationalStatusPipe } from '../../../../shared/pipes/operational-status.pipe';

interface RoomCard extends Room {
  utilization: number;
  fillClass: 'donut-low' | 'donut-medium' | 'donut-high';
  dashArray: string;
}

const RADIUS        = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-room-utilization',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatChipsModule,
    OperationalStatusPipe,
  ],
  templateUrl: './room-utilization.html',
  styleUrl: './room-utilization.scss',
})
export class RoomUtilization implements OnInit {
  private adminService = inject(AdminService);
  rooms = input<Room[]>([]);
  filterStart = input<Date | null>(null);
  filterEnd = input<Date | null>(null);
  private utilizationData = signal<RoomUtilizationData[]>([]);
  private dayEvents = signal<RoomScheduleEvent[]>([]);

  viewMode = signal<'month' | 'day'>('month');
  selectedDay = signal<Date>(new Date());
  peakThreshold = signal<number>(parseInt(localStorage.getItem('peakThreshold') ?? '80'));

  readonly circumference = CIRCUMFERENCE;

  selectedLabel = signal('');

  readonly hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];

  daySlots = computed(() => {
    const events = this.dayEvents();
    const rooms = this.rooms();
    const day = this.selectedDay();

    return rooms.map(room => {
      const roomEvents = events.filter(e => e.roomId === room.id);
      const slots = this.hours.map(h => {
        const hour = parseInt(h, 10);
        const isOccupied = roomEvents.some(e => {
          const start = this.parseDate(e.startTime);
          const end = new Date(start.getTime() + (e.durationMinutes || 0) * 60000);
          return start.getHours() <= hour && end.getHours() > hour;
        });
        return isOccupied;
      });
      return { room, slots };
    });
  });

  peakRooms = computed(() =>
    this.roomCards().filter(r => r.utilization >= this.peakThreshold())
  );

  ngOnInit(): void {
    effect(() => {
      this.onDateChange();
    });
  }

  roomCards = computed<RoomCard[]>(() => {
    const dataMap = new Map(this.utilizationData().map(u => [u.roomId, u.utilizationPercent]));
    return this.rooms().map(room => {
      const utilization = Math.round(dataMap.get(room.id) ?? 0);
      const fillClass   = utilization > 70 ? 'donut-high'
                        : utilization > 40 ? 'donut-medium'
                        : 'donut-low';
      const filled    = (utilization / 100) * CIRCUMFERENCE;
      const dashArray = `${filled.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
      return { ...room, utilization, fillClass, dashArray };
    });
  });

  onDateChange(): void {
    const start = this.filterStart();
    const end = this.filterEnd();
    if (start && end) {
      this.selectedLabel.set(`${this.fmt(start)} – ${this.fmt(end)}`);
      
      const startStr = this.toLocalIsoDate(start);
      const endStr   = this.toLocalIsoDate(end);
      
      this.adminService.getRoomUtilizations(startStr, endStr)
        .subscribe(data => this.utilizationData.set(data));
    }
  }

  onThresholdChange(val: number): void {
    this.peakThreshold.set(val);
    localStorage.setItem('peakThreshold', val.toString());
  }

  onDaySelect(date: Date): void {
    if (!date) return;
    this.selectedDay.set(date);
    const startStr = this.toLocalIsoDate(date) + 'T00:00:00';
    const endStr = this.toLocalIsoDate(date) + 'T23:59:59';
    this.adminService.getRoomSchedule(startStr, endStr)
      .subscribe(events => this.dayEvents.set(events));
  }

  onViewModeToggle(mode: 'month' | 'day'): void {
    this.viewMode.set(mode);
    if (mode === 'day') {
      this.onDaySelect(this.selectedDay());
    } else {
      this.onDateChange();
    }
  }

  private parseDate(d: any): Date {
    if (d instanceof Date) return d;
    if (!d) return new Date(NaN);
    if (Array.isArray(d) && d.length >= 3) {
      return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0);
    }
    if (typeof d === 'string') {
      return new Date(d.indexOf('T') === -1 ? d.replace(' ', 'T') : d);
    }
    return new Date(d);
  }

  private toLocalIsoDate(date: Date): string {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate());
  }

  fmt(d: Date): string {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
