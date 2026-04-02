import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminService, CourseSeries } from '../admin.service';
import { CourseSeriesDialogComponent } from './course-series-dialog.component';

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

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, TranslateModule],
  templateUrl: './event-management.html',
  styleUrl: './event-management.scss',
})
export class EventManagement implements OnInit {
  displayedColumns: string[] = ['id', 'moduleName', 'assignedLecturerName', 'status', 'selectedExamTypeName', 'studyGroups', 'actions'];
  dataSource = signal<CourseSeries[]>([]);

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
      next: (data) => this.dataSource.set(data),
      error: (err) => this.snackBar.open(this.translate.instant('eventManagement.errorLoading'), this.translate.instant('common.close'), { duration: 3000 })
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(CourseSeriesDialogComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.createCourseSeries(result).subscribe({
          next: () => {
            this.snackBar.open(this.translate.instant('eventManagement.createdSuccessfully'), this.translate.instant('common.close'), { duration: 3000 });
            this.loadData();
          },
          error: (err) => this.snackBar.open(this.translate.instant('eventManagement.failedToCreate'), this.translate.instant('common.close'), { duration: 3000 })
        });
      }
    });
  }

  openEditDialog(courseSeries: CourseSeries) {
    const dialogRef = this.dialog.open(CourseSeriesDialogComponent, { width: '500px', data: { courseSeries } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Optimistic UI Update using signals
        this.dataSource.update(data => data.map(item => item.id === courseSeries.id ? { ...item, ...result } : item));
        
        this.adminService.updateCourseSeries(courseSeries.id, result).subscribe({
          next: () => {
            this.snackBar.open(this.translate.instant('eventManagement.updatedSuccessfully'), this.translate.instant('common.close'), { duration: 3000 });
            this.loadData();
          },
          error: (err) => {
            this.snackBar.open(this.translate.instant('eventManagement.failedToUpdate'), this.translate.instant('common.close'), { duration: 3000 });
            this.loadData(); // Revert on failure
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
        this.dataSource.update(data => data.filter(item => item.id !== id));

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

  getStudyGroupNames(element: CourseSeries): string {
    return element.studyGroups?.map(sg => sg.name).join(', ') || '-';
  }
}
