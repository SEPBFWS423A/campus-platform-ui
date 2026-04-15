import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'holiday' | 'closed';
}

@Component({
  selector: 'app-holidays',
  imports: [CommonModule, FormsModule],
  templateUrl: './holidays.html',
  styleUrl: './holidays.scss',
})
export class Holidays {
  showForm = false;

  newHoliday = { name: '', startDate: '', endDate: '', type: 'holiday' as 'holiday' | 'closed' };

  holidays: Holiday[] = [
    { id: 1, name: 'Ostern', startDate: '2026-04-03', endDate: '2026-04-06', type: 'holiday' },
    { id: 2, name: 'Tag der Arbeit', startDate: '2026-05-01', endDate: '2026-05-01', type: 'holiday' },
    { id: 3, name: 'Pfingsten', startDate: '2026-05-24', endDate: '2026-05-25', type: 'holiday' },
    { id: 4, name: 'Wartungsarbeiten', startDate: '2026-06-15', endDate: '2026-06-15', type: 'closed' },
  ];

  add(): void {
    if (!this.newHoliday.name || !this.newHoliday.startDate || !this.newHoliday.endDate) return;
    this.holidays.push({
      id: Date.now(),
      ...this.newHoliday
    });
    this.newHoliday = { name: '', startDate: '', endDate: '', type: 'holiday' };
    this.showForm = false;
  }

  delete(id: number): void {
    this.holidays = this.holidays.filter(h => h.id !== id);
  }
}