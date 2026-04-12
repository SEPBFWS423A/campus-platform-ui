export interface AcademicTermResponse {
  season: 'SUMMER' | 'WINTER';
  startYear: number;
  endYear: number | null;
}

export interface AssessmentTypeResponse {
  code: string;
  submission: boolean;
  nameDe: string | null;
  nameEn: string | null;
  shortDe: string | null;
  shortEn: string | null;
}

export type StudentGradeStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'EXCUSED_ABSENCE'
  | 'UNEXCUSED_ABSENCE'
  | 'EXCLUDED';

export interface StudentGradeOverviewItemResponse {
  courseSeriesId: number;
  moduleId: number;
  moduleName: string;
  moduleSemester: number;
  studyGroupNames: string[];
  assessmentType: AssessmentTypeResponse | null;
  examDate: string | null;
  academicTerm: AcademicTermResponse | null;
  ects: number | null;
  status: StudentGradeStatus;
  attemptNumber: number | null;
  grade: number | null;
  reviewerComment: string | null;
  lastUpdatedAt: string | null;
}

export interface StudentGradeSemesterGroupResponse {
  moduleSemester: number;
  items: StudentGradeOverviewItemResponse[];
}

export interface StudentGradeSummaryResponse {
  currentAverage: number | null;
  achievedEcts: number;
  totalEcts: number;
  passedModulesCount: number;
  failedModulesCount: number;
  gradedAssessmentsCount: number;
  pendingAssessmentsCount: number;
  excusedAbsenceAssessmentsCount: number;
  unexcusedAbsenceAssessmentsCount: number;
  excludedAssessmentsCount: number;
}

export interface StudentGradeOverviewResponse {
  summary: StudentGradeSummaryResponse;
  semesters: StudentGradeSemesterGroupResponse[];
}
