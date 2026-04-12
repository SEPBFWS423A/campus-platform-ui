import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LecturerActiveCourseResponse, StudentAttendeeResponse } from '../../../../core/models/lecturer-courses.models';
import { LecturerCoursesService } from '../../../../core/services/lecturer-courses.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-course-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './course-detail-dialog.html',
  styleUrl: './course-detail-dialog.scss'
})
export class CourseDetailDialog implements OnInit {
  private readonly lecturerService = inject(LecturerCoursesService);
  private readonly dialogRef = inject(MatDialogRef<CourseDetailDialog>);
  readonly data = inject<LecturerActiveCourseResponse>(MAT_DIALOG_DATA);

  attendees = signal<StudentAttendeeResponse[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.fetchAttendees();
  }

  fetchAttendees(): void {
    this.isLoading.set(true);
    this.lecturerService.getSeriesAttendees(this.data.id).subscribe({
      next: (attendees) => {
        this.attendees.set(attendees);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
