import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminService, CourseStatus, Module, User, StudyGroup } from '../../admin.service';

@Component({
  selector: 'app-course-series-create-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, TranslateModule
  ],
  templateUrl: './course-series-create-dialog.html',
  styleUrl: './course-series-create-dialog.scss'
})
export class CourseSeriesCreateDialog implements OnInit {
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
        return group.specializationId?.toString() === mod.specializationId.toString();
      } else {
        return group.courseOfStudyId?.toString() === mod.courseOfStudyId?.toString();
      }
    });
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public translateService: TranslateService,
    public dialogRef: MatDialogRef<CourseSeriesCreateDialog>
  ) {
    this.form = this.fb.group({
      moduleId: [null, Validators.required],
      assignedLecturerId: [null, Validators.required],
      selectedExamTypeId: [null],
      studyGroupIds: [[], [Validators.required, Validators.minLength(1)]]
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
      next: (res) => {
        this.allGroups.set(res.map(g => ({ ...g, courseOfStudy: g.courseOfStudyName })));
      }
    });

    this.form.get('moduleId')?.valueChanges.subscribe(modId => {
      this.selectedModuleId.set(modId);
      const currentLecturerId = this.form.get('assignedLecturerId')?.value;
      if (currentLecturerId) {
        const stillValid = this.selectedModuleLecturers.some(l => l.id?.toString() === currentLecturerId.toString());
        if (!stillValid) {
          this.form.get('assignedLecturerId')?.setValue(null);
        }
      }

      const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
      if (mod && mod.preferredExamTypeId) {
        this.form.get('selectedExamTypeId')?.setValue(Number(mod.preferredExamTypeId));
      } else {
        this.form.get('selectedExamTypeId')?.setValue(null);
      }

      this.form.get('studyGroupIds')?.setValue([]);
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
    const mod = this.modules().find(m => m.id?.toString() === modId?.toString());
    return mod?.possibleExamTypes || [];
  }

  save() {
    if (this.form.valid) {
      const result = {
        ...this.form.value,
        status: CourseStatus.PLANNED,
        submissionStartDate: null,
        submissionDeadline: null
      };
      this.dialogRef.close(result);
    }
  }
}
