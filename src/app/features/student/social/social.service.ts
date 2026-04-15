import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export enum StudentEventCategory {
  STUDY = 'STUDY',
  SOCIAL = 'SOCIAL',
  SPORTS = 'SPORTS',
  WORKSHOP = 'WORKSHOP',
  OTHER = 'OTHER'
}

export interface CommunityEventRequest {
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  category: StudentEventCategory;
  roomId?: number;
  customLocation?: string;
}

export interface AttendeeInfo {
  id: number;
  name: string;
}

export interface CommunityEventResponse {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  category: StudentEventCategory;
  creatorId: number;
  creatorName: string;
  roomId?: number;
  roomName?: string;
  customLocation?: string;
  attendees: AttendeeInfo[];
}

export interface PublicProfileResponse {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  studyGroupName: string;
  bio?: string;
  interests?: string;
  hobbies?: string;
  skills?: string;
  visibility: boolean;
}

export interface PublicProfileRequest {
  bio?: string;
  interests?: string;
  hobbies?: string;
  skills?: string;
  visibility?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private eventsUrl = `${environment.apiUrl}/social/events`;
  private profileUrl = `${environment.apiUrl}/social/profile`;

  constructor(private http: HttpClient) { }

  getEvents(): Observable<CommunityEventResponse[]> {
    return this.http.get<CommunityEventResponse[]>(this.eventsUrl);
  }

  getRooms(start?: string, end?: string, excludeId?: number): Observable<any[]> {
    let url = `${this.eventsUrl}/rooms`;
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (excludeId) params.excludeId = excludeId;
    
    return this.http.get<any[]>(url, { params });
  }

  createEvent(request: CommunityEventRequest): Observable<CommunityEventResponse> {
    return this.http.post<CommunityEventResponse>(this.eventsUrl, request);
  }

  updateEvent(id: number, request: CommunityEventRequest): Observable<CommunityEventResponse> {
    return this.http.put<CommunityEventResponse>(`${this.eventsUrl}/${id}`, request);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsUrl}/${id}`);
  }

  rsvpToEvent(id: number): Observable<void> {
    return this.http.post<void>(`${this.eventsUrl}/${id}/rsvp`, {});
  }

  cancelRsvp(id: number): Observable<void> {
    return this.http.delete<void>(`${this.eventsUrl}/${id}/rsvp`);
  }

  // Profile Methods
  getMyProfile(): Observable<PublicProfileResponse | null> {
    return this.http.get<PublicProfileResponse>(`${this.profileUrl}/me`, { observe: 'response' })
      .pipe(
        map(resp => resp.status === 204 ? null : resp.body)
      );
  }

  joinSocialHub(request: PublicProfileRequest): Observable<PublicProfileResponse> {
    return this.http.post<PublicProfileResponse>(`${this.profileUrl}/me`, request);
  }

  updateMyProfile(request: PublicProfileRequest): Observable<PublicProfileResponse> {
    return this.http.put<PublicProfileResponse>(`${this.profileUrl}/me`, request);
  }

  searchFellowStudents(query: string): Observable<PublicProfileResponse[]> {
    return this.http.get<PublicProfileResponse[]>(`${this.profileUrl}/search?q=${query}`);
  }
}
