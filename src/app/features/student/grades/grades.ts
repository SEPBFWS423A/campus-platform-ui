import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GradeScaleDialog } from '../../../shared/components/grade-scale-dialog/grade-scale-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { GradesService } from '../../../core/services/grades.services';
import {
  AcademicTermResponse,
  AssessmentTypeResponse,
  StudentGradeOverviewItemResponse,
  StudentGradeOverviewResponse,
  StudentGradeSemesterGroupResponse,
  StudentGradeStatus
} from '../../../core/models/grades.models';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './grades.html',
  styleUrl: './grades.scss'
})
export class Grades implements OnInit {
  overview: StudentGradeOverviewResponse | null = null;
  loading = false;
  errorKey: string | null = null;

  expandedItemId: number | null = null;
  expandedSemesters = new Set<number>();

  private readonly dialog = inject(MatDialog);

  constructor(
    public readonly gradesService: GradesService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.errorKey = null;
    this.cdr.detectChanges();

    this.gradesService
      .getOverview()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          this.overview = response;
          this.expandedSemesters = new Set(response.semesters.map(s => s.moduleSemester));
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Fehler beim Laden der Notenübersicht', err);
          this.errorKey = 'navigation.grades.states.loadError';
          this.overview = null;
          this.cdr.detectChanges();
        }
      });
  }

  toggleItem(item: StudentGradeOverviewItemResponse): void {
    this.expandedItemId = this.expandedItemId === item.courseSeriesId ? null : item.courseSeriesId;
    this.cdr.detectChanges();
  }

  isExpanded(item: StudentGradeOverviewItemResponse): boolean {
    return this.expandedItemId === item.courseSeriesId;
  }

  toggleSemester(group: StudentGradeSemesterGroupResponse): void {
    if (this.expandedSemesters.has(group.moduleSemester)) {
      this.expandedSemesters.delete(group.moduleSemester);
    } else {
      this.expandedSemesters.add(group.moduleSemester);
    }
    this.cdr.detectChanges();
  }

  isSemesterExpanded(group: StudentGradeSemesterGroupResponse): boolean {
    return this.expandedSemesters.has(group.moduleSemester);
  }

  get hasVisibleEctsSummary(): boolean {
    if (!this.overview) {
      return false;
    }
    return this.overview.summary.totalEcts > 0 || this.overview.summary.achievedEcts > 0;
  }

  get totalAverage(): number | null {
    if (!this.overview) return null;
    const allItems = this.overview.semesters.flatMap(s => s.items);
    return this.gradesService.calculateWeightedAverage(allItems);
  }

  getStatusClass(status: StudentGradeStatus): string {
    switch (status) {
      case 'PASSED':
        return 'grade-status grade-status--passed';
      case 'FAILED':
        return 'grade-status grade-status--failed';
      case 'EXCUSED_ABSENCE':
        return 'grade-status grade-status--excused';
      case 'UNEXCUSED_ABSENCE':
        return 'grade-status grade-status--unexcused';
      case 'EXCLUDED':
        return 'grade-status grade-status--excluded';
      default:
        return 'grade-status grade-status--pending';
    }
  }

  getGradeBadgeClass(grade: number | null): string {
    if (grade === null || grade === undefined) {
      return 'grade-badge grade-badge--empty';
    }

    if (grade <= 1.3) {
      return 'grade-badge grade-badge--excellent';
    }

    if (grade <= 2.0) {
      return 'grade-badge grade-badge--good';
    }

    if (grade <= 3.3) {
      return 'grade-badge grade-badge--medium';
    }

    return 'grade-badge grade-badge--bad';
  }

  getLocalizedAssessmentType(type: AssessmentTypeResponse | null): string {
    if (!type) {
      return this.translate.instant('navigation.grades.common.notAvailable');
    }

    const lang = (
      this.translate.getCurrentLang() ||
      this.translate.getFallbackLang() ||
      'de'
    ).toLowerCase();

    if (lang.startsWith('en')) {
      return type.nameEn?.trim() || type.nameDe?.trim() || type.code;
    }

    return type.nameDe?.trim() || type.nameEn?.trim() || type.code;
  }

  getTermTranslationKey(term: AcademicTermResponse | null): string {
    if (!term?.season) {
      return 'navigation.grades.common.notAvailable';
    }
    return `navigation.grades.term.${term.season}`;
  }

  formatAcademicTermYears(term: AcademicTermResponse | null): string {
    if (!term) {
      return '';
    }

    if (term.season === 'SUMMER') {
      return String(term.startYear);
    }

    if (term.endYear == null) {
      return String(term.startYear);
    }

    return `${term.startYear}/${String(term.endYear).slice(-2)}`;
  }

  formatStudyGroups(names: string[] | null | undefined): string {
    if (!names?.length) {
      return this.translate.instant('navigation.grades.common.notAvailable');
    }
    return names.join(', ');
  }

  getSectionTitle(group: StudentGradeSemesterGroupResponse): string {
    const firstTerm = group.items[0]?.academicTerm;
    const lang = (
      this.translate.getCurrentLang() ||
      this.translate.getFallbackLang() ||
      'de'
    ).toLowerCase();

    if (!firstTerm) {
      return this.translate.instant('navigation.grades.semester.title', {
        count: group.moduleSemester
      });
    }

    const years = this.formatAcademicTermYears(firstTerm);

    if (lang.startsWith('de')) {
      return firstTerm.season === 'WINTER' ? `WiSe ${years}` : `SoSe ${firstTerm.startYear}`;
    }

    return firstTerm.season === 'WINTER' ? `Winter ${years}` : `Summer ${firstTerm.startYear}`;
  }

  getSectionMeta(group: StudentGradeSemesterGroupResponse): string {
    return this.translate.instant('navigation.grades.semester.courseCount', {
      count: group.items.length
    });
  }

  getSectionAchievedEcts(group: StudentGradeSemesterGroupResponse): number {
    return group.items
      .filter(item => item.status === 'PASSED')
      .map(item => item.ects ?? 0)
      .reduce((sum, value) => sum + value, 0);
  }

  trackSemester(_: number, semester: StudentGradeSemesterGroupResponse): number {
    return semester.moduleSemester;
  }

  trackGradeItem(_: number, item: StudentGradeOverviewItemResponse): number {
    return item.courseSeriesId;
  }

  openGradeScale(): void {
    this.gradesService.getGradeScale().subscribe(entries => {
      this.dialog.open(GradeScaleDialog, {
        width: '600px',
        data: { entries }
      });
    });
  }
}
