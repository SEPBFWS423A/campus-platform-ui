import { Component, computed, input, signal, inject, effect, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OperationalStatusPipe } from '../../../../shared/pipes/operational-status.pipe';
import { Room, AdminService, RoomScheduleEvent } from '../../admin.service';

type View = 'kachel' | 'kalender';

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const DAY_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

@Component({
  selector: 'app-room-schedule',
  imports: [MatButtonModule, MatButtonToggleModule, MatCardModule, MatIconModule, MatDialogModule, MatChipsModule, OperationalStatusPipe],
  templateUrl: './room-schedule.html',
  styleUrl: './room-schedule.scss',
})
export class RoomSchedule {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);

  rooms = input<Room[]>([]);
  selectedRoomId = input<number | null>(null);
  filterStart = input<Date | null>(null);
  filterEnd = input<Date | null>(null);
  mode = input<'overview' | 'detail'>('overview');
  
  resetRoom = output<void>();
  private rawEvents = signal<RoomScheduleEvent[]>([]);

  mergedEvents = computed(() => {
    return this.mergeConsecutiveEvents(this.rawEvents());
  });

  filteredEvents = computed(() => {
    const roomId = this.selectedRoomId();
    return roomId ? this.mergedEvents().filter(e => e.roomId === roomId) : this.mergedEvents();
  });

  currentView = signal<View>('kachel');
  weekOffset = signal(0);

  today = signal(new Date());

  readonly hours = HOURS;
  readonly dayFull = DAY_FULL;

  constructor() {
    effect(() => {
      this.loadWeekEvents();
    }, { allowSignalWrites: true });
  }

  weekData = computed(() => {
    const { monday, friday } = this.getWeekBounds();

    const days = DAY_SHORT.map((s, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return { short: `${s} ${dd}.${mm}`, full: DAY_FULL[i] };
    });

    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

    const jan4 = new Date(monday.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000);
    const kw = Math.ceil((dayOfYear + jan4.getDay()) / 7);

    return { label: `KW ${kw} (${fmt(monday)} – ${fmt(friday)})`, days };
  });

  loadWeekEvents(): void {
    const { monday, friday } = this.getWeekBounds();
    const start = this.toLocalIsoDateTime(monday);
    const end = this.toLocalIsoDateTime(new Date(friday.getTime() + 1000));
    this.adminService.getRoomSchedule(start, end)
      .subscribe(events => this.rawEvents.set(events || []));
  }

  private toLocalIsoDateTime(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  private getWeekBounds(): { monday: Date, friday: Date } {
    const offset = this.weekOffset();
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + ((dow === 0 ? -6 : 1) - dow) + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { monday, friday };
  }

  getDayDate(index: number): Date {
    const { monday } = this.getWeekBounds();
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    return d;
  }

  getEventsForRoomOnDay(roomId: number, dayDate: Date): RoomScheduleEvent[] {
    return this.filteredEvents().filter(e => {
      const eDate = this.parseDate(e.startTime);
      return e.roomId === roomId
        && eDate.toDateString() === dayDate.toDateString();
    });
  }

  getEventAtHour(hour: string, dayDate: Date): RoomScheduleEvent | undefined {
    const h = parseInt(hour.split(':')[0], 10);
    return this.filteredEvents().find(e => {
      const start = this.parseDate(e.startTime);
      const end   = new Date(start.getTime() + (e.durationMinutes || 0) * 60000);
      return start.toDateString() === dayDate.toDateString()
          && h >= start.getHours() && h < end.getHours();
    });
  }

  private mergeConsecutiveEvents(events: RoomScheduleEvent[]): RoomScheduleEvent[] {
    if (!events || events.length <= 1) return events || [];

    // 1. Sortieren nach Raum und Startzeit
    const sorted = [...events].sort((a, b) => {
      if (a.roomId !== b.roomId) return a.roomId - b.roomId;
      return this.parseDate(a.startTime).getTime() - this.parseDate(b.startTime).getTime();
    });

    const result: RoomScheduleEvent[] = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentStart = this.parseDate(current.startTime);
      const currentEnd = new Date(currentStart.getTime() + (current.durationMinutes || 60) * 60000);
      const nextStart = this.parseDate(next.startTime);

      const sameRoom = current.roomId === next.roomId;
      
      // Name normalisieren für Vergleich (ignoriere Case und Leerzeichen)
      const nameCurrent = (current.eventName || '').trim().toLowerCase();
      const nameNext    = (next.eventName || '').trim().toLowerCase();
      
      const sameCourse = (current.courseSeriesId != null && current.courseSeriesId === next.courseSeriesId) || 
                         (nameCurrent !== '' && nameCurrent === nameNext);

      // Verhindere Merging über verschiedene Tage hinweg
      const sameDay = currentStart.toDateString() === nextStart.toDateString();
      
      // Abstand zwischen Ende des jetzigen und Start des nächsten prüfen
      const gapMs = nextStart.getTime() - currentEnd.getTime();
      
      // Merge Kriterium: Lücke zwischen -60 Min (Overlap) und +30 Min
      const isConsecutive = sameDay && gapMs >= -3600000 && gapMs <= 1800000;

      if (sameRoom && sameCourse && isConsecutive) {
        // Dauer intelligent verlängern (Start des jetzigen bis Ende des nächsten)
        const nextEnd = new Date(nextStart.getTime() + (next.durationMinutes || 60) * 60000);
        const maxEndMs = Math.max(currentEnd.getTime(), nextEnd.getTime());
        
        current.durationMinutes = (maxEndMs - currentStart.getTime()) / 60000;
      } else {
        result.push(current);
        current = { ...next };
      }
    }
    result.push(current);

    return result;
  }

  getEventsForRoomInWeek(roomId: number): RoomScheduleEvent[] {
    return this.filteredEvents().filter(e => e.roomId === roomId);
  }

  formatEventTime(event: RoomScheduleEvent): string {
    const d = this.parseDate(event.startTime);
    const end = new Date(d.getTime() + (event.durationMinutes || 0) * 60000);
    const day = DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${day}, ${pad(d.getHours())}:${pad(d.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  private parseDate(d: any): Date {
    if (d instanceof Date) return d;
    if (!d) return new Date(NaN);
    if (Array.isArray(d) && d.length >= 3) {
      // Jackson array format [yyyy, mm, dd, hh, mm, ss]
      return new Date(d[0], d[1] - 1, d[2], d[3] || 0, d[4] || 0, d[5] || 0);
    }
    if (typeof d === 'string') {
      return new Date(d.indexOf('T') === -1 ? d.replace(' ', 'T') : d);
    }
    return new Date(d);
  }

  prevWeek(): void { this.weekOffset.update(o => o - 1); }
  nextWeek(): void { this.weekOffset.update(o => o + 1); }

  formatEventTimeOnly(event: RoomScheduleEvent): string {
    const d = this.parseDate(event.startTime);
    const end = new Date(d.getTime() + (event.durationMinutes || 0) * 60000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  getEventTop(event: RoomScheduleEvent): number {
    const start = this.parseDate(event.startTime);
    const hoursFromStart = start.getHours() - 8 + (start.getMinutes() / 60);
    return hoursFromStart * 56; // 56px ist die Höhe einer hour-cell
  }

  getEventHeight(event: RoomScheduleEvent): number {
    return (event.durationMinutes / 60) * 56 - 2; // -2 für Padding/Border
  }

  onResetRoom(): void {
    this.resetRoom.emit();
  }

  openRoomSchedule(room: Room): void {
    // Dynamischer Import um Zirkelbezüge zu vermeiden
    import('./room-schedule.dialog').then(m => {
      this.dialog.open(m.RoomScheduleDialog, {
        data: { room },
        width: '1000px',
        maxWidth: '95vw',
        maxHeight: '90vh'
      });
    });
  }
}
