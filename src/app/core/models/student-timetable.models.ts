export interface StudentEventResponse {
  id: number;
  name: string;
  eventType: 'LEHRVERANSTALTUNG' | 'KLAUSUR';
  startTime: string;
  durationMinutes: number;
  moduleName: string;
  lecturerName: string;
  rooms: string[];
  submission: boolean;
}

export interface StudentActiveCourseResponse {
  id: number;
  moduleName: string;
  lecturerName: string;
  status: string;
  examTypeName: string;
  submission: boolean;
  submissionDeadline?: string;
}
