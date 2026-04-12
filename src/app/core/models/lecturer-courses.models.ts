export interface LecturerEventResponse {
  id: number;
  name: string;
  eventType: 'LEHRVERANSTALTUNG' | 'KLAUSUR';
  startTime: string;
  durationMinutes: number;
  moduleName: string;
  studyGroups: string[];
  rooms: string[];
}

export interface LecturerActiveCourseResponse {
  id: number;
  moduleName: string;
  studyGroups: string[];
  status: string;
  examTypeName: string;
  isSubmission: boolean;
  submissionDeadline?: string;
  attendeeCount: number;
}

export interface StudentAttendeeResponse {
  studentId: number;
  studentName: string;
  studentNumber: string;
  status: string;
  fileName?: string;
  submissionDate?: string;
  grade?: number;
  points?: number;
  feedback?: string;
  studyGroupName?: string;
}
