import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, CourseSeries } from '../admin.service';
import { LecturerCourseResponse } from '../../lecturer/models/lecturer.models';
import { ExamManagementList } from '../../../shared/components/exam-management-list/exam-management-list';

@Component({
  selector: 'app-exam-management',
  standalone: true,
  imports: [CommonModule, ExamManagementList],
  templateUrl: './exam-management.html',
  styleUrl: './exam-management.scss',
})
export class ExamManagement implements OnInit {
  courses = signal<LecturerCourseResponse[]>([]);
  isLoading = signal(false);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAllExams();
  }

  loadAllExams(): void {
    this.isLoading.set(true);
    this.adminService.getCourseSeries().subscribe({
      next: (series: CourseSeries[]) => {
        const mapped = series.map((s: CourseSeries) => this.mapToLecturerCourseResponse(s));
        this.courses.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private mapToLecturerCourseResponse(series: CourseSeries): LecturerCourseResponse {
    return {
      id: series.id,
      moduleName: series.moduleName,
      studyGroupNames: series.studyGroups ? series.studyGroups.map((g) => g.name) : [],
      examTypeName: series.selectedExamTypeName || 'N/A',
      submission: series.submission,
      examStatus: series.examStatus,
      examFileName: series.examFileName,
      solutionFileName: series.solutionFileName,
      lecturerNotes: series.lecturerNotes,
      submissionDeadline: series.submissionDeadline || undefined,
      submissionCount: series.submissionCount || 0,
      lecturerName: series.assignedLecturerName,
      lecturerId: series.assignedLecturerId,
      events: (series.events || []).map((e) => ({
        id: e.id,
        type: e.type,
        start: e.start,
        end: e.end,
        roomName: e.roomName || 'N/A',
        roomExamSeats: e.roomExamSeats || 0,
      })),
    };
  }
}
