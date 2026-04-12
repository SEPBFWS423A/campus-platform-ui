import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LecturerApi } from '../services/lecturer-api';
import { LecturerCourseResponse } from '../models/lecturer.models';
import { ExamManagementList } from '../../../shared/components/exam-management-list/exam-management-list';

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [
    CommonModule,
    ExamManagementList
  ],
  templateUrl: './grading.html',
  styleUrl: './grading.scss',
})
export class Grading implements OnInit {
  courses = signal<LecturerCourseResponse[]>([]);
  isLoadingCourses = signal(false);

  constructor(private lecturerApi: LecturerApi) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoadingCourses.set(true);
    this.lecturerApi.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.isLoadingCourses.set(false);
      },
      error: () => {
        this.isLoadingCourses.set(false);
      }
    });
  }
}
