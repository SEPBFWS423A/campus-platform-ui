import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export enum UserRole {
  Admin = 'ADMIN',
  Lecturer = 'LECTURER',
  Student = 'STUDENT'
}

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  
  // Student Specific Fields
  studentNumber?: string;
  courseOfStudy?: string;
  startYear?: number;
  focus?: string;
}

export interface InvitationPayload {
  email: string;
  role: UserRole;
  studentNumber?: string;
  courseOfStudy?: string;
  focus?: string;
}

export interface BulkInvitationPayload {
  invitations: InvitationPayload[];
}

export interface StudyGroup {
  id: string;
  name: string;
  focus: string;
  courseOfStudy: string;
  memberCount: number;
  memberIds: string[];
}

export interface UserStats {
  total: number;
  staff: number;
  students: number;
}

// --- Academic Structure ---
export interface CourseOfStudy {
  id: string;
  name: string;
}

export interface Focus {
  id: string;
  name: string;
  courseId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private adminApiUrl = environment.apiUrl + '/admin';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.adminApiUrl}/users`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.adminApiUrl}/users/stats`);
  }

  inviteUser(invitation: InvitationPayload): Observable<void> {
    return this.http.post<void>(`${this.adminApiUrl}/invite`, invitation);
  }

  bulkInvite(invitations: InvitationPayload[]): Observable<void> {
    return this.http.post<void>(`${this.adminApiUrl}/invite/bulk`, { invitations });
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.adminApiUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/users/${id}`);
  }

  // --- Student Group Management ---
  getGroups(): Observable<StudyGroup[]> {
    return this.http.get<StudyGroup[]>(`${this.adminApiUrl}/groups`);
  }

  createGroup(group: Partial<StudyGroup>): Observable<StudyGroup> {
    return this.http.post<StudyGroup>(`${this.adminApiUrl}/groups`, group);
  }

  addGroupMember(groupId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.adminApiUrl}/groups/${groupId}/members/${userId}`, {});
  }

  removeGroupMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/groups/${groupId}/members/${userId}`);
  }

  // --- Academic Structure Management ---
  getCourses(): Observable<CourseOfStudy[]> {
    return this.http.get<CourseOfStudy[]>(`${this.adminApiUrl}/courses`);
  }

  createCourse(course: Partial<CourseOfStudy>): Observable<CourseOfStudy> {
    return this.http.post<CourseOfStudy>(`${this.adminApiUrl}/courses`, course);
  }

  updateCourse(id: string, course: Partial<CourseOfStudy>): Observable<CourseOfStudy> {
    return this.http.put<CourseOfStudy>(`${this.adminApiUrl}/courses/${id}`, course);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/courses/${id}`);
  }

  getFocuses(): Observable<Focus[]> {
    return this.http.get<Focus[]>(`${this.adminApiUrl}/focuses`);
  }

  createFocus(focus: Partial<Focus>): Observable<Focus> {
    return this.http.post<Focus>(`${this.adminApiUrl}/focuses`, focus);
  }

  updateFocus(id: string, focus: Partial<Focus>): Observable<Focus> {
    return this.http.put<Focus>(`${this.adminApiUrl}/focuses/${id}`, focus);
  }

  deleteFocus(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/focuses/${id}`);
  }
}
