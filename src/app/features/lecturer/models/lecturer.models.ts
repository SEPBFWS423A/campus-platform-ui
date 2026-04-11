export enum ExamStatus {
  OPEN = 'OPEN',
  PROVIDED = 'PROVIDED',
  GRADING = 'GRADING',
  COMPLETED = 'COMPLETED'
}

export enum ExamCategory {
  WRITTEN = 'WRITTEN',
  SUBMISSION = 'SUBMISSION'
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED'
}

export interface LecturerCourseEvent {
  id: number;
  type: string;
  start: string;
  end: string;
  roomName: string;
  roomExamSeats: number;
}

export interface LecturerCourseResponse {
  id: number;
  moduleName: string;
  studyGroupNames: string[];
  examTypeName: string;
  examCategory: ExamCategory;
  examStatus: ExamStatus;
  examFileName?: string;
  solutionFileName?: string;
  lecturerNotes?: string;
  submissionDeadline?: string;
  events: LecturerCourseEvent[];
  submissionCount: number;
}

export interface StudentSubmissionResponse {
  studentId: number;
  studentName: string;
  studentNumber: string;
  status: SubmissionStatus;
  documentUrl?: string; 
  submissionDate?: string;
  grade?: number;
  points?: number;
  feedback?: string;
}

export interface ExamMaterialsRequest {
  examFileName?: string;
  examContent?: string;
  solutionFileName?: string;
  solutionContent?: string;
  lecturerNotes: string;
}

export interface StudentGradeItem {
  studentId: number;
  grade: number;
  points?: number;
  feedback: string;
}

export interface GradeBulkRequest {
  grades: StudentGradeItem[];
}

export enum ExamDocumentType {
  EXAM_PAPER = 'EXAM_PAPER',
  SAMPLE_SOLUTION = 'SAMPLE_SOLUTION'
}

export interface ExamDocumentResponse {
  fileName: string;
  content: string;
}

export interface SingleGradeRequest {
  studentId: number;
  grade?: number;
  points?: number;
  feedback: string;
}

export interface GradeScaleEntry {
  id?: number;
  grade: number;
  minimumPoints: number;
  label?: string;
}

export interface SubmissionDocumentDownloadData {
  fileName: string;
  mimeType: string;
  fileSize: number;
  content: string;
}
