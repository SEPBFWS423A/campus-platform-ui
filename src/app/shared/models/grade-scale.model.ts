export interface GradeScaleEntryResponse {
  grade: number;
  minimumPoints: number;
  label: string | null;
}

export interface GradeScaleResponse {
  entries: GradeScaleEntryResponse[];
}
