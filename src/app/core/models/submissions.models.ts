export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED';

export interface SubmissionDocumentResponse {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface StudentSubmissionListItemResponse {
  submissionId: number;
  courseSeriesId: number;
  courseName: string | null;
  studyGroupNames: string[];
  examTypeName: string | null;
  status: SubmissionStatus;
  submissionStartDate: string | null;
  submissionDeadline: string | null;
  effectiveSubmissionDeadline: string | null;
  individualSubmissionDeadline: string | null;
  hasIndividualDeadline: boolean;
  hasDocuments: boolean;
  missingDocuments: boolean;
  editable: boolean;
  overdue: boolean;
  grade: number | null;
  points: number | null;
}

export interface StudentSubmissionDetailResponse {
  submissionId: number;
  courseSeriesId: number;
  courseName: string | null;
  studyGroupNames: string[];
  examTypeName: string | null;
  status: SubmissionStatus;
  submissionStartDate: string | null;
  submissionDeadline: string | null;
  effectiveSubmissionDeadline: string | null;
  individualSubmissionDeadline: string | null;
  hasIndividualDeadline: boolean;
  submissionDate: string | null;
  hasDocuments: boolean;
  missingDocuments: boolean;
  editable: boolean;
  finalSubmitAllowed: boolean;
  grade: number | null;
  points: number | null;
  feedback: string | null;
  documents: SubmissionDocumentResponse[];
}

export interface UploadSubmissionDocumentRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
  contentBase64: string;
}
