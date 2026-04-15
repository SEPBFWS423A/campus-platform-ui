import { Component, Inject, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseOfStudy, Module, DegreeType } from '../../admin.service';
import { ThemeController } from '../../../../core/theme/theme-controller';



export interface GenerateHandbookDialogData {
  courses: CourseOfStudy[];
  modules: Module[];
}

@Component({
  selector: 'app-generate-handbook-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
    TranslateModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon color="primary">description</mat-icon>
          {{ 'academicStructure.generateHandbook' | translate }}
        </h2>
        <button mat-icon-button (click)="onCancel()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p class="dialog-subtitle">{{ 'academicStructure.generateHandbookSubtitle' | translate }}</p>
        
        <div class="form-container">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ 'academicStructure.courseOfStudy' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedCourseId" (selectionChange)="onCourseChange()">
              @for (course of coursesWithModules(); track course.id) {
                <mat-option [value]="course.id">{{ course.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ 'academicStructure.degree' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedDegree" [disabled]="!selectedCourseId()">
              @for (degree of availableDegrees(); track degree) {
                <mat-option [value]="degree">{{ degree === 'BACHELOR' ? 'Bachelor' : 'Master' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>


          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ 'navigation.profileAndSettings.language' | translate }}</mat-label>
            <mat-select [(ngModel)]="selectedLanguage">
              <mat-option value="de">Deutsch</mat-option>
              <mat-option value="en">English</mat-option>
            </mat-select>
          </mat-form-field>

        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">{{ 'common.cancel' | translate }}</button>
        <button mat-flat-button color="primary" 
                [disabled]="!selectedCourseId() || !selectedDegree()"
                (click)="onGenerate()">
          {{ 'academicStructure.generate' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container { min-width: 400px; padding: 2rem; overflow: hidden }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
    h2 { display: flex; align-items: center; gap: 12px; margin: 0; font-weight: 600; font-size: 1.25rem; }
    .dialog-subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; padding-left: 0; }
    .form-container { display: flex; flex-direction: column; gap: 8px; }
    .w-full { width: 100%; }
    .language-selection { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    label { font-size: 0.8rem; font-weight: 500; color: #64748b; margin-left: 4px; }
    mat-dialog-actions { padding: 16px 0 8px; border-top: 1px solid #f1f5f9; margin-top: 16px; }
    .close-button { margin-top: -8px; margin-right: -8px; color: #94a3b8; }
  `]
})
export class GenerateHandbookDialog {
  private translate = inject(TranslateService);
  private themeController = inject(ThemeController);

  selectedCourseId = signal<string>('');
  selectedDegree = signal<DegreeType | null>(null);
  selectedLanguage = signal<string>(this.themeController.activeLanguage());


  coursesWithModules = computed(() => {
    return this.data.courses.filter(course =>
      this.data.modules.some(m => m.courseOfStudyId === course.id)
    ).sort((a, b) => a.name.localeCompare(b.name));
  });

  availableDegrees = computed(() => {
    const courseId = this.selectedCourseId();
    if (!courseId) return [];

    const courseModules = this.data.modules.filter(m => m.courseOfStudyId === courseId);
    if (courseModules.length === 0) return [];

    // In this model, a CourseOfStudy has one degreeType.
    // If we have modules for it, we just return the degree of the course.
    const course = this.data.courses.find(c => c.id === courseId);
    return course ? [course.degreeType] : [];
  });

  constructor(
    public dialogRef: MatDialogRef<GenerateHandbookDialog>,
    @Inject(MAT_DIALOG_DATA) public data: GenerateHandbookDialogData
  ) { }

  onCourseChange() {
    const degrees = this.availableDegrees();
    if (degrees.length === 1) {
      this.selectedDegree.set(degrees[0]);
    } else {
      this.selectedDegree.set(null);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onGenerate() {
    const course = this.data.courses.find(c => c.id === this.selectedCourseId());
    if (course && this.selectedDegree()) {
      this.dialogRef.close({
        course: course,
        degree: this.selectedDegree(),
        language: this.selectedLanguage()
      });
    }
  }
}
