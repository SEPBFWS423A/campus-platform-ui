import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService, CourseSeries, CourseStatus, Module, User, StudyGroup } from '../admin.service';

@Component({
  selector: 'app-course-series-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.courseSeries ? ('eventManagement.editCourseSeries' | translate) : ('eventManagement.addCourseSeries' | translate) }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.module' | translate }}</mat-label>
          <mat-select formControlName="moduleId" required>
            <mat-option *ngFor="let m of modules()" [value]="m.id">{{ m.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.assignedLecturer' | translate }}</mat-label>
          <mat-select formControlName="assignedLecturerId" required>
            <mat-option *ngFor="let l of selectedModuleLecturers" [value]="l.id">
              {{ l.title ? l.title + ' ' : '' }}{{ l.firstName }} {{ l.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.status' | translate }}</mat-label>
          <mat-select formControlName="status" required>
            <mat-option value="PLANNED">{{ 'eventManagement.statusPLANNED' | translate }}</mat-option>
            <mat-option value="ACTIVE">{{ 'eventManagement.statusACTIVE' | translate }}</mat-option>
            <mat-option value="COMPLETED">{{ 'eventManagement.statusCOMPLETED' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.examTypeOptional' | translate }}</mat-label>
          <mat-select formControlName="selectedExamTypeId">
            <mat-option [value]="null">{{ 'eventManagement.none' | translate }}</mat-option>
            <mat-option *ngFor="let et of selectedModuleExamTypes" [value]="et.id">{{ et.nameDe }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.submissionStartDate' | translate }}</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="submissionStartDate" (click)="startPicker.open()">
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.submissionDeadline' | translate }}</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="submissionDeadline" (click)="endPicker.open()">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'eventManagement.studyGroups' | translate }}</mat-label>
          <mat-select formControlName="studyGroupIds" multiple>
            <mat-option *ngFor="let sg of filteredGroups()" [value]="sg.id">{{ sg.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>{{ 'eventManagement.cancel' | translate }}</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid" (click)="save()">{{ 'eventManagement.save' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      margin-top: 8px;
    }
  `]
})
export class CourseSeriesDialog implements OnInit {
  form: FormGroup;
  modules = signal<Module[]>([]);
  lecturers: User[] = [];
  allGroups = signal<StudyGroup[]>([]);
  selectedModuleId = signal<number | null>(null);

  filteredGroups = computed(() => {
    const modId = this.selectedModuleId();
    if (!modId) return [];

    const mod = this.modules().find(m => m.id?.toString() === modId.toString());
    if (!mod) return [];

    return this.allGroups().filter(group => {
      if (mod.specializationId) {
        // If module has a specialization, only show groups for THAT specialization
        return group.specializationId?.toString() === mod.specializationId.toString();
      } else {
        // General module: show all groups within the course of study
        return group.courseOfStudyId?.toString() === mod.courseOfStudyId.toString();
      }
    });
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public dialogRef: MatDialogRef<CourseSeriesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { courseSeries?: CourseSeries }
  ) {
    const initialModuleId = data.courseSeries?.moduleId || null;
    this.selectedModuleId.set(initialModuleId);

    this.form = this.fb.group({
      moduleId: [initialModuleId, Validators.required],
      assignedLecturerId: [data.courseSeries?.assignedLecturerId || null, Validators.required],
      status: [data.courseSeries?.status || CourseStatus.PLANNED, Validators.required],
      selectedExamTypeId: [data.courseSeries?.selectedExamTypeId || null],
      submissionStartDate: [data.courseSeries?.submissionStartDate ? new Date(data.courseSeries.submissionStartDate) : null],
      submissionDeadline: [data.courseSeries?.submissionDeadline ? new Date(data.courseSeries.submissionDeadline) : null],
      studyGroupIds: [data.courseSeries?.studyGroups?.map(sg => sg.id) || []]
    });
  }

  ngOnInit() {
    this.adminService.getModules().subscribe({
      next: (res) => this.modules.set(res)
    });
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.lecturers = res.filter(u => u.role?.toString() === 'LECTURER');
      }
    });

    this.adminService.getGroups().subscribe({
      next: (res) => this.allGroups.set(res)
    });

    // Reset assignedLecturer and update module signal when module changes
    this.form.get('moduleId')?.valueChanges.subscribe(modId => {
      this.selectedModuleId.set(modId);
      const currentLecturerId = this.form.get('assignedLecturerId')?.value;
      if (currentLecturerId) {
        // If current lecturer doesn't teach the newly selected module, clear it
        const stillValid = this.selectedModuleLecturers.some(l => l.id?.toString() === currentLecturerId.toString());
        if (!stillValid) {
          this.form.get('assignedLecturerId')?.setValue(null);
        }
      }

      // Pre-select the preferred exam type for the newly selected module
      const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
      if (mod && mod.preferredExamTypeId) {
        this.form.get('selectedExamTypeId')?.setValue(Number(mod.preferredExamTypeId));
      } else {
        // If no preferred exam type, clear the selection out of safety
        this.form.get('selectedExamTypeId')?.setValue(null);
      }

      // Filter study groups: Clear current selection if no longer valid
      const selectedGroupIds = this.form.get('studyGroupIds')?.value as (number | string)[] || [];
      const validGroupIds = this.filteredGroups().map(g => g.id.toString());
      const newSelection = selectedGroupIds.filter(id => validGroupIds.includes(id.toString()));
      this.form.get('studyGroupIds')?.setValue(newSelection);
    });
  }

  get selectedModuleLecturers() {
    const modId = this.selectedModuleId();
    if (!modId) return [];
    const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
    return mod?.lecturers || [];
  }

  get selectedModuleExamTypes() {
    const modId = this.selectedModuleId();
    if (!modId) return [];
    // The ID strings or numbers handles safely with standard loose check or toString
    const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
    return mod?.possibleExamTypes || [];
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
