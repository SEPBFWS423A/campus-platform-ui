import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal, computed } from '@angular/core';

import { AdminService, CourseSeries } from '../admin.service';
import { CourseSeriesCreateDialogComponent } from './course-series-create-dialog/course-series-create-dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'eventManagement.confirmAction' | translate }}</h2>
    <mat-dialog-content>{{ 'eventManagement.confirmDeleteMsg' | translate }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'eventManagement.cancel' | translate }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ 'eventManagement.delete' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {}

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, TranslateModule],
  templateUrl: './event-management.html',
  styleUrl: './event-management.scss',
})
export class EventManagement implements OnInit {
  displayedColumns: string[] = ['id', 'moduleName', 'assignedLecturerName', 'status', 'selectedExamTypeName', 'studyGroups', 'actions'];
  
  allCourseSeries = signal<CourseSeries[]>([]);
  searchQuery = signal('');

  dataSource = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const series = this.allCourseSeries();
    if (!query) return series;

    return series.filter(s => {
      const translatedStatus = this.translate.instant('eventManagement.status' + s.status).toLowerCase();
      return s.id?.toString().includes(query) ||
             s.moduleName?.toLowerCase().includes(query) ||
             s.assignedLecturerName?.toLowerCase().includes(query) ||
             s.status?.toLowerCase().includes(query) ||
             translatedStatus.includes(query) ||
             s.selectedExamTypeName?.toLowerCase().includes(query) ||
             s.studyGroups?.some(sg => sg.name.toLowerCase().includes(query));
    });
  });

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.adminService.getCourseSeries().subscribe({
      next: (data) => this.allCourseSeries.set(data),
      error: (err) => this.snackBar.open(this.translate.instant('eventManagement.errorLoading'), this.translate.instant('common.close'), { duration: 3000 })
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(CourseSeriesCreateDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.createCourseSeries(result).subscribe({
          next: () => {
            this.snackBar.open(this.translate.instant('eventManagement.createdSuccessfully'), this.translate.instant('common.close'), { duration: 3000 });
            this.loadData();
          },
          error: (err) => {
            const messageKey = err.error?.message || 'eventManagement.failedToCreate';
            this.snackBar.open(this.translate.instant(messageKey), this.translate.instant('common.close'), { duration: 5000 });
          }
        });
      }
    });
  }

  deleteItem(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '350px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Optimistic UI Update using signals
        this.allCourseSeries.update(data => data.filter(item => item.id !== id));

        this.adminService.deleteCourseSeries(id).subscribe({
          next: () => {
            this.snackBar.open(this.translate.instant('eventManagement.deletedSuccessfully'), this.translate.instant('common.close'), { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open(this.translate.instant('eventManagement.failedToDelete'), this.translate.instant('common.close'), { duration: 3000 });
            this.loadData(); // Revert on failure
          }
        });
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  getStudyGroupNames(element: CourseSeries): string {
    return element.studyGroups?.map(sg => sg.name).join(', ') || '-';
  }
}
