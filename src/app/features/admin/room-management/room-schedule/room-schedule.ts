import { Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Room } from '../../admin.service';

type View = 'kachel' | 'kalender';

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const DAY_FULL  = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

@Component({
  selector: 'app-room-schedule',
  imports: [MatButtonModule, MatButtonToggleModule, MatCardModule, MatIconModule],
  templateUrl: './room-schedule.html',
  styleUrl: './room-schedule.scss',
})
export class RoomSchedule {
  rooms = input<Room[]>([]);

  currentView = signal<View>('kachel');
  weekOffset  = signal(0);

  readonly hours    = HOURS;
  readonly dayFull  = DAY_FULL;

  weekData = computed(() => {
    const offset = this.weekOffset();
    const now    = new Date();
    const dow    = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + ((dow === 0 ? -6 : 1) - dow) + offset * 7);

    const days = DAY_SHORT.map((s, i) => {
      const d  = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return { short: `${s} ${dd}.${mm}`, full: DAY_FULL[i] };
    });

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

    const jan4      = new Date(monday.getFullYear(), 0, 4);
    const dayOfYear = Math.floor((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000);
    const kw        = Math.ceil((dayOfYear + jan4.getDay()) / 7);

    return { label: `KW ${kw} (${fmt(monday)} – ${fmt(friday)})`, days };
  });

  prevWeek(): void { this.weekOffset.update(o => o - 1); }
  nextWeek(): void { this.weekOffset.update(o => o + 1); }
}
