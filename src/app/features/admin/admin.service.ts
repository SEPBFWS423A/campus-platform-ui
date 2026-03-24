import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export { UserRole } from '../../core/models/user-role';
import { UserRole } from '../../core/models/user-role';

export interface User {
  id: string;
  salutation?: string; // e.g. "Mr.", "Ms.", "Mx." 
  title?: string;      // e.g. "Dr.", "Prof."
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enabled: boolean;

  // Student Specific Fields
  studentNumber?: string;
  courseOfStudy?: string;
  courseOfStudyName?: string;
  specializationId?: string;
  specializationName?: string;
  startYear?: number;
}

export interface GroupMember {
  id: string;
  studentNumber: string;
  title?: string;
  firstName: string;
  lastName: string;
}

export interface ModuleLecturer {
  id: string;
  title?: string;
  firstName: string;
  lastName: string;
}

export interface InvitationPayload {
  email: string;
  role: UserRole;
  studentNumber?: string;
  courseOfStudy?: string;
  specialization?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  courseOfStudy: string;
  specialization: string;
  memberCount: number;
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
}

export interface Module {
  id: string;
  name: string;
  semester: number;
  requiredTotalHours: number;
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
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

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

  // --- Institution Information ---
  getInstitutionInfo(): Observable<InstitutionInfo> {
    return this.http.get<InstitutionInfo>(`${this.apiUrl}/institution`);
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
}
