import { Component, computed, input, signal, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { Room, AdminService, RoomUtilizationData } from '../../admin.service';

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
  ],
  templateUrl: './room-utilization.html',
  styleUrl: './room-utilization.scss',
})
export class RoomUtilization implements OnInit {
  private adminService = inject(AdminService);
  rooms = input<Room[]>([]);
  private utilizationData = signal<RoomUtilizationData[]>([]);

  readonly circumference = CIRCUMFERENCE;

  readonly dateRange = new FormGroup({
    start: new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end:   new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
  });

  selectedLabel = signal('');

  ngOnInit(): void {
    this.onDateChange();
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
    const { start, end } = this.dateRange.value;
    if (start && end) {
      this.selectedLabel.set(`${this.fmt(start)} – ${this.fmt(end)}`);
      
      const startStr = this.toLocalIsoDate(start);
      const endStr   = this.toLocalIsoDate(end);
      
      this.adminService.getRoomUtilizations(startStr, endStr)
        .subscribe(data => this.utilizationData.set(data));
    }
  }

  private toLocalIsoDate(date: Date): string {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate());
  }

  private fmt(d: Date): string {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
