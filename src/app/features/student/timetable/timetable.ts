import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StudentTimetableService } from '../../../core/services/student-timetable.service';
import { StudentActiveCourseResponse, StudentEventResponse } from '../../../core/models/student-timetable.models';
import { EventDetailsDialog } from './event-details-dialog/event-details-dialog';

export interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: StudentEventResponse[];
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule, MatIconModule],
  templateUrl: './timetable.html',
  styleUrl: './timetable.scss'
})
export class Timetable implements OnInit {
  private readonly timetableService = inject(StudentTimetableService);
  private readonly dialog = inject(MatDialog);

  upcomingEvents = signal<StudentEventResponse[]>([]);
  activeCourses = signal<StudentActiveCourseResponse[]>([]);
  isLoading = signal(true);

  // View state
  viewMode = signal<'list' | 'calendar'>('calendar');
  currentDate = signal(new Date());
  
  // Grouped events for List View
  groupedEvents = signal<{ [key: string]: StudentEventResponse[] }>({});

  // Calendar logic
  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start with the first day of the week (Monday)
    // getDay() returns 0 for Sunday, so we adjust to 0 for Monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Sunday
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get events map for efficient lookup
    const events = this.upcomingEvents();
    const eventsMap = new Map<string, StudentEventResponse[]>();
    events.forEach(e => {
      const d = e.startTime.split('T')[0];
      if (!eventsMap.has(d)) eventsMap.set(d, []);
      eventsMap.get(d)!.push(e);
    });

    // Generate 42 days (6 weeks) for a consistent grid
    const startDate = new Date(year, month, 1 - startOffset);
    
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      currentDay.setHours(0, 0, 0, 0);

      const dateString = currentDay.toISOString().split('T')[0];
      
      days.push({
        date: currentDay,
        dateString,
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.getTime() === today.getTime(),
        events: eventsMap.get(dateString) || []
      });
    }
    
    return days;
  });

  weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading.set(true);
    
    this.timetableService.getUpcomingEvents().subscribe({
      next: (events) => {
        this.upcomingEvents.set(events);
        this.groupEventsByDate(events);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete()
    });

    this.timetableService.getActiveCourses().subscribe({
      next: (courses) => {
        this.activeCourses.set(courses);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete()
    });
  }

  private checkLoadingComplete(): void {
    this.isLoading.set(false);
  }

  private groupEventsByDate(events: StudentEventResponse[]): void {
    const groups: { [key: string]: StudentEventResponse[] } = {};
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    events.forEach(event => {
      const dateKey = event.startTime.split('T')[0];
      let groupLabel = dateKey;

      if (dateKey === today) groupLabel = 'today';
      else if (dateKey === tomorrow) groupLabel = 'tomorrow';

      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(event);
    });

    this.groupedEvents.set(groups);
  }

  getGroupKeys(): string[] {
    return Object.keys(this.groupedEvents());
  }

  // Navigation
  prevMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode.set(mode);
  }

  openEventDetails(event: StudentEventResponse): void {
    this.dialog.open(EventDetailsDialog, {
      data: event,
      maxWidth: '500px',
      width: '95%'
    });
  }
}
