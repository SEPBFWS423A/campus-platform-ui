import { Component, computed, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { Room } from '../../admin.service';

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
export class RoomUtilization {
  rooms = input<Room[]>([]);

  readonly circumference = CIRCUMFERENCE;

  readonly dateRange = new FormGroup({
    start: new FormControl<Date | null>(new Date()),
    end:   new FormControl<Date | null>(new Date()),
  });

  selectedLabel = signal(this.formatToday());

  roomCards = computed<RoomCard[]>(() =>
    this.rooms().map(room => {
      // Booking data is not yet available from the backend.
      // Utilization will be populated once the scheduling API is ready.
      const utilization = 0;
      const fillClass   = utilization > 70 ? 'donut-high'
                        : utilization > 40 ? 'donut-medium'
                        : 'donut-low';
      const filled    = (utilization / 100) * CIRCUMFERENCE;
      const dashArray = `${filled.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
      return { ...room, utilization, fillClass, dashArray };
    })
  );

  onDateChange(): void {
    const { start, end } = this.dateRange.value;
    if (start && end) {
      this.selectedLabel.set(
        `${this.fmt(start)} – ${this.fmt(end)}`
      );
    }
  }

  private fmt(d: Date): string {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatToday(): string {
    return this.fmt(new Date());
  }
}
