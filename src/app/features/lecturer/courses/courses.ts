import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LecturerCoursesService } from '../../../core/services/lecturer-courses.service';
import { LecturerActiveCourseResponse, LecturerEventResponse } from '../../../core/models/lecturer-courses.models';
import { CourseDetailDialog } from './course-detail-dialog/course-detail-dialog';
import { LecturerEventDetailsDialog } from './lecturer-event-dialog/lecturer-event-dialog';

export interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: LecturerEventResponse[];
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule],
  templateUrl: './courses.html',
  styleUrl: './courses.scss'
})
export class Courses implements OnInit {
  private readonly lecturerService = inject(LecturerCoursesService);
  private readonly dialog = inject(MatDialog);

  upcomingEvents = signal<LecturerEventResponse[]>([]);
  activeCourses = signal<LecturerActiveCourseResponse[]>([]);
  isLoading = signal(true);

  // View state
  viewMode = signal<'list' | 'calendar'>('calendar');
  currentDate = signal(new Date());
  
  // Grouped events for List View
  groupedEvents = signal<{ [key: string]: LecturerEventResponse[] }>({});

  // Calendar logic
  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Sunday
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = this.upcomingEvents();
    const eventsMap = new Map<string, LecturerEventResponse[]>();
    events.forEach(e => {
      const d = e.startTime.split('T')[0];
      if (!eventsMap.has(d)) eventsMap.set(d, []);
      eventsMap.get(d)!.push(e);
    });

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
    
    this.lecturerService.getTimetableEvents().subscribe({
      next: (events) => {
        this.upcomingEvents.set(events);
        this.groupEventsByDate(events);
        this.checkLoadingComplete();
      },
      error: () => this.checkLoadingComplete()
    });

    this.lecturerService.getActiveCourses().subscribe({
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

  private groupEventsByDate(events: LecturerEventResponse[]): void {
    const groups: { [key: string]: LecturerEventResponse[] } = {};
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

  openCourseDetails(course: LecturerActiveCourseResponse): void {
    this.dialog.open(CourseDetailDialog, {
      data: course,
      maxWidth: '800px',
      width: '95%'
    });
  }

  openEventDetails(event: LecturerEventResponse): void {
    this.dialog.open(LecturerEventDetailsDialog, {
      data: event,
      maxWidth: '500px',
      width: '95%'
    });
  }
}
