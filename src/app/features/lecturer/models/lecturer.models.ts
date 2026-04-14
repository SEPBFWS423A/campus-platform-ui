export enum ExamStatus {
  OPEN = 'OPEN',
  PROVIDED = 'PROVIDED',
  GRADING = 'GRADING',
  COMPLETED = 'COMPLETED'
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
  submission: boolean;
  examStatus: ExamStatus;
  examFileName?: string;
  solutionFileName?: string;
  lecturerNotes?: string;
  submissionDeadline?: string;
  events: LecturerCourseEvent[];
  submissionCount: number;
  lecturerName?: string;
  lecturerId?: number;
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

export enum AbsenceType {
  URLAUB = 'URLAUB',
  KRANKMELDUNG = 'KRANKMELDUNG',
  DIENSTREISE = 'DIENSTREISE',
  SONSTIGES = 'SONSTIGES'
}

export type AbsenceStatus = 'BEANTRAGT' | 'GENEHMIGT' | 'ABGELEHNT' | 'STORNIERT' | 'ABGESCHLOSSEN';
export type AbsencePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LecturerAbsenceResponse {
  id: number;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  note?: string;
  lecturerName?: string;
  // Governance-Felder (Issue #10)
  status: AbsenceStatus;
  priority: AbsencePriority;
  documentRequired: boolean;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface LecturerAbsenceRequest {
  type: AbsenceType;
  startDate: string;
  endDate: string;
  note?: string;
  priority?: AbsencePriority;
}

export interface ConflictingEventDto {
  eventId: number;
  eventName: string;
  startTime: string;
  endTime: string;
}

export interface AbsenceConflictError {
  message: string;
  conflictingEvents: ConflictingEventDto[];
}

