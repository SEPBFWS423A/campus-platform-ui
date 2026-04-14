import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { UserRole } from '../../core/models/user-role';
import { FaqAdminResponse, FaqUpsertRequest } from '../../core/models/faqModel';
import { Salutation } from '../../core/models/salutation';
import { AcademicTitle } from '../../core/models/academic-title';
import { ExamStatus } from '../lecturer/models/lecturer.models';

export { UserRole, Salutation, AcademicTitle };

export interface User {
  id: string;
  salutation?: Salutation;
  title?: AcademicTitle;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enabled: boolean;

  // Student Specific Fields
  studentNumber?: string;
  courseOfStudy?: string;
  courseOfStudyId?: string;
  courseOfStudyName?: string;
  specializationId?: string;
  specializationName?: string;
  startYear?: number;
  startQuartal?: number;
}

export interface GroupMember {
  id: string;
  studentNumber: string;
  title?: AcademicTitle;
  firstName: string;
  lastName: string;
}

export interface ModuleLecturer {
  id: string;
  title?: AcademicTitle;
  firstName: string;
  lastName: string;
}

export interface InvitationPayload {
  email: string;
  role: UserRole;
  studentNumber?: string;
  courseOfStudy?: string;
  specializationId?: number;
  startYear?: number;
  startQuartal?: number;
  language?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  courseOfStudyId: string;
  courseOfStudyName: string;
  specializationId: string;
  specialization: string;
  memberCount: number;
  startYear?: number;
  startQuartal?: number;
  members: GroupMember[];
}

export enum DegreeType {
  Bachelor = 'BACHELOR',
  Master = 'MASTER'
}

export interface CourseOfStudy {
  id: string;
  name: string;
  degreeType: DegreeType;
}

export interface Specialization {
  id: string;
  name: string;
  courseId: string;
}


export interface ModuleExam {
  id: string;
  type: string;
  nameDe: string;
  nameEn: string;
  shortDe: string;
  shortEn: string;
  submission: boolean;
}

export interface Module {
  id: string;
  name: string;
  semester: number;
  requiredTotalHours: number;
  ects?: number | null;
  possibleExamTypes: ModuleExam[];
  lecturers: ModuleLecturer[];
  courseOfStudyId: string;
  specializationId?: string;
  preferredExamTypeId?: string;
}

export interface InstitutionInfo {
  universityName: string;
  city: string;
  sekretariatEmail: string;
  sekretariatPhone: string;
  sekretariatOpeningTimes: string;
  websiteEmail: string;
  bibliothekUrl: string;
  mensaUrl: string;
  impressum: string;
  invitationEmailSubjectDe?: string;
  invitationEmailBodyDe?: string;
  invitationEmailSubjectEn?: string;
  invitationEmailBodyEn?: string;
  passwordResetEmailSubjectDe?: string;
  passwordResetEmailBodyDe?: string;
  passwordResetEmailSubjectEn?: string;
  passwordResetEmailBodyEn?: string;
}

export type RoomType = 'HOERSAAL' | 'SEMINARRAUM' | 'LABOR' | 'PRUEFUNGSRAUM' | 'BUERO' | 'SONSTIGES';
export type OperationalStatus = 'AKTIV' | 'EINGESCHRAENKT' | 'GESPERRT' | 'WARTUNG' | 'AUSSER_BETRIEB';

export interface Room {
  id: number;
  name: string;
  seats: number;
  examSeats: number;
  building: string;
  floor?: number;
  roomType: RoomType;
  operationalStatus: OperationalStatus;
  features: string[];
  barrierefreiheit: boolean;
  description?: string;
}

export type BlockoutReason = 'WARTUNG' | 'REINIGUNG' | 'BAUARBEITEN' | 'VERANSTALTUNG' | 'STOERUNG' | 'SONSTIGES';
export type BlockoutPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RoomBlockout {
  id: number;
  roomId: number;
  roomName: string;
  startTime: string;   // ISO-DateTime
  endTime: string;
  reason: BlockoutReason;
  priority: BlockoutPriority;
  notes?: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
}

export interface BlockoutConflictResult {
  overlappingBlockouts: RoomBlockout[];
  affectedEvents: RoomScheduleEvent[];
}

export interface RoomStatusHistory {
  id: number;
  roomId: number;
  previousStatus: OperationalStatus;
  newStatus: OperationalStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}


export enum CourseStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  GRADING = 'GRADING',
  COMPLETED = 'COMPLETED'
}

export interface CourseSeries {
  id: number;
  moduleId: number;
  moduleName: string;
  assignedLecturerId: number;
  assignedLecturerName: string;
  status: CourseStatus;
  examStatus: ExamStatus;
  selectedExamTypeId?: number;
  selectedExamTypeName?: string;
  submission: boolean;
  submissionStartDate?: string;
  submissionDeadline?: string;
  studyGroups: { id: number; name: string }[];
  examFileName?: string;
  solutionFileName?: string;
  lecturerNotes?: string;
  submissionCount?: number;
  events?: {
    id: number;
    type: string;
    start: string;
    end: string;
    roomName: string;
    roomExamSeats: number;
  }[];
}

export interface CourseSeriesRequest {
  moduleId: number;
  assignedLecturerId: number;
  status: CourseStatus;
  selectedExamTypeId?: number;
  submissionStartDate?: string;
  submissionDeadline?: string;
  studyGroupIds: number[];
}

export interface CourseEvent {
  id: number;
  courseSeriesId: number;
  rooms: { id: number; name: string }[];
  name: string;
  eventType: string;
  startTime?: string;
  durationMinutes?: number;
}

export interface CourseEventRequest {
  roomId?: number;
  name: string;
  eventType: string;
  startTime?: string;
  durationMinutes?: number;
}

export interface RoomScheduleEvent {
  eventId: number;
  eventName: string;
  eventType: string;        // 'LEHRVERANSTALTUNG' | 'KLAUSUR'
  roomId: number;
  roomName: string;
  startTime: string;        // ISO-DateTime-String
  durationMinutes: number;
  courseSeriesId: number;
  moduleName: string;
}

export interface RoomUtilizationData {
  roomId: number;
  roomName: string;
  seats: number;
  examSeats: number;
  utilizationPercent: number;
  bookedMinutes: number;
  totalAvailableMinutes: number;
  plannedEventCount: number;
  pastEventCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // --- User Management ---
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  inviteUser(payload: InvitationPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitations`, payload);
  }

  bulkInvite(invitations: InvitationPayload[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitations/bulk`, { invitations });
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  // --- Study Groups ---
  getGroups(): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(`${this.apiUrl}/groups`);
  }

  createGroup(group: Partial<StudyGroup>): Observable<StudyGroup> {
    return this.http.post<StudyGroup>(`${this.apiUrl}/groups`, group);
  }

  updateGroup(id: string, group: Partial<StudyGroup>): Observable<StudyGroup> {
    return this.http.put<StudyGroup>(`${this.apiUrl}/groups/${id}`, group);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${id}`);
  }

  addGroupMember(groupId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/groups/${groupId}/members/${userId}`, {});
  }

  removeGroupMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/members/${userId}`);
  }

  // --- Course of Study ---
  getCourses(): Observable<CourseOfStudy[]> {
    return this.http.get<CourseOfStudy[]>(`${this.apiUrl}/courses`);
  }

  createCourse(course: Partial<CourseOfStudy>): Observable<CourseOfStudy> {
    return this.http.post<CourseOfStudy>(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: string, course: Partial<CourseOfStudy>): Observable<CourseOfStudy> {
    return this.http.put<CourseOfStudy>(`${this.apiUrl}/courses/${id}`, course);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/${id}`);
  }

  // --- Specialization Areas ---
  getSpecializations(): Observable<Specialization[]> {
    return this.http.get<Specialization[]>(`${this.apiUrl}/specializations`);
  }

  createSpecialization(specialization: Partial<Specialization>): Observable<Specialization> {
    return this.http.post<Specialization>(`${this.apiUrl}/specializations`, specialization);
  }

  updateSpecialization(id: string, specialization: Partial<Specialization>): Observable<Specialization> {
    return this.http.put<Specialization>(`${this.apiUrl}/specializations/${id}`, specialization);
  }

  deleteSpecialization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/specializations/${id}`);
  }

  // --- Module Management ---
  getModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/modules`);
  }

  createModule(module: Partial<Module>): Observable<Module> {
    return this.http.post<Module>(`${this.apiUrl}/modules`, module);
  }

  updateModule(id: string, module: Partial<Module>): Observable<Module> {
    return this.http.put<Module>(`${this.apiUrl}/modules/${id}`, module);
  }

  deleteModule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/modules/${id}`);
  }

  updateInstitutionInfo(info: InstitutionInfo): Observable<InstitutionInfo> {
    return this.http.put<InstitutionInfo>(`${this.apiUrl}/institution`, info);
  }

  // --- Exam Types ---
  getExamTypes(): Observable<ModuleExam[]> {
    return this.http.get<ModuleExam[]>(`${this.apiUrl}/exam-types`);
  }

  createExamType(examType: Partial<ModuleExam>): Observable<ModuleExam> {
    return this.http.post<ModuleExam>(`${this.apiUrl}/exam-types`, examType);
  }

  updateExamType(id: string, examType: Partial<ModuleExam>): Observable<ModuleExam> {
    return this.http.put<ModuleExam>(`${this.apiUrl}/exam-types/${id}`, examType);
  }

  deleteExamType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exam-types/${id}`);
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms`);
  }

  createRoom(room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms`, room);
  }

  updateRoom(id: number, room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/${id}`);
  }

  updateRoomStatus(id: number, status: OperationalStatus): Observable<Room> {
    return this.http.patch<Room>(`${this.apiUrl}/rooms/${id}/status`, { status });
  }

  getRoomSchedule(start: string, end: string): Observable<RoomScheduleEvent[]> {
    return this.http.get<RoomScheduleEvent[]>(`${this.apiUrl}/rooms/schedule`, {
      params: { start, end }
    });
  }

  getRoomUtilizations(startDate: string, endDate: string): Observable<RoomUtilizationData[]> {
    return this.http.get<RoomUtilizationData[]>(`${this.apiUrl}/rooms/utilization`, {
      params: { startDate, endDate }
    });
  }

  // --- Room Blockouts ---
  getBlockouts(roomId?: number, active?: boolean): Observable<RoomBlockout[]> {
    let params: any = {};
    if (roomId) params.roomId = roomId;
    if (active !== undefined) params.active = active;
    return this.http.get<RoomBlockout[]>(`${this.apiUrl}/rooms/blockouts`, { params });
  }

  createBlockout(blockout: Partial<RoomBlockout>): Observable<RoomBlockout> {
    return this.http.post<RoomBlockout>(`${this.apiUrl}/rooms/blockouts`, blockout);
  }

  resolveBlockout(id: number): Observable<RoomBlockout> {
    return this.http.patch<RoomBlockout>(`${this.apiUrl}/rooms/blockouts/${id}/resolve`, {});
  }

  deleteBlockout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/blockouts/${id}`);
  }

  checkBlockoutConflicts(roomId: number, start: string, end: string): Observable<BlockoutConflictResult> {
    return this.http.get<BlockoutConflictResult>(`${this.apiUrl}/rooms/${roomId}/blockouts/conflicts`, {
      params: { start, end }
    });
  }

  getRoomStatusHistory(roomId: number): Observable<RoomStatusHistory[]> {
    return this.http.get<RoomStatusHistory[]>(`${this.apiUrl}/rooms/${roomId}/status-history`);
  }


  // --- FAQ Management ---
  getFaqs(): Observable<FaqAdminResponse[]> {
    return this.http.get<FaqAdminResponse[]>(`${this.apiUrl}/faqs`);
  }

  createFaq(payload: FaqUpsertRequest): Observable<FaqAdminResponse> {
    return this.http.post<FaqAdminResponse>(`${this.apiUrl}/faqs`, payload);
  }

  updateFaq(id: number, payload: FaqUpsertRequest): Observable<FaqAdminResponse> {
    return this.http.put<FaqAdminResponse>(`${this.apiUrl}/faqs/${id}`, payload);
  }

  deleteFaq(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/faqs/${id}`);
  }

  getAvailableRooms(startTime?: string, durationMinutes?: number, excludeEventId?: number, seriesId?: number, eventType?: string): Observable<Room[]> {
    let params: any = {};
    if (startTime) params.startTime = startTime;
    if (durationMinutes) params.durationMinutes = durationMinutes;
    if (excludeEventId) params.excludeEventId = excludeEventId;
    if (seriesId) params.seriesId = seriesId;
    if (eventType) params.eventType = eventType;
    return this.http.get<Room[]>(`${this.apiUrl}/rooms/available`, { params });
  }

  // --- Course Series ---
  getCourseSeries(): Observable<CourseSeries[]> {
    return this.http.get<CourseSeries[]>(`${this.apiUrl}/course-series`);
  }

  getCourseSeriesById(id: number): Observable<CourseSeries> {
    return this.http.get<CourseSeries>(`${this.apiUrl}/course-series/${id}`);
  }

  createCourseSeries(request: CourseSeriesRequest): Observable<CourseSeries> {
    return this.http.post<CourseSeries>(`${this.apiUrl}/course-series`, request);
  }

  updateCourseSeries(id: number, request: CourseSeriesRequest): Observable<CourseSeries> {
    return this.http.put<CourseSeries>(`${this.apiUrl}/course-series/${id}`, request);
  }

  deleteCourseSeries(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/course-series/${id}`);
  }

  // --- Events ---
  getEventsForSeries(seriesId: number): Observable<CourseEvent[]> {
    return this.http.get<CourseEvent[]>(`${this.apiUrl}/course-series/${seriesId}/events`);
  }

  createEvent(seriesId: number, request: CourseEventRequest): Observable<CourseEvent> {
    return this.http.post<CourseEvent>(`${this.apiUrl}/course-series/${seriesId}/events`, request);
  }

  fastAddEvent(seriesId: number): Observable<CourseEvent> {
    return this.http.post<CourseEvent>(`${this.apiUrl}/course-series/${seriesId}/fast-add-event`, {});
  }

  autoSchedule(seriesId: number, config: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/course-series/${seriesId}/auto-schedule`, config);
  }

  updateEvent(eventId: number, request: CourseEventRequest): Observable<CourseEvent> {
    return this.http.put<CourseEvent>(`${this.apiUrl}/events/${eventId}`, request);
  }

  deleteEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${eventId}`);
  }

  // --- Grade Scale ---
  getGradeScale(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/grade-scale`);
  }

  saveGradeScaleEntry(entry: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/grade-scale`, entry);
  }

  deleteGradeScaleEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/grade-scale/${id}`);
  }
}
