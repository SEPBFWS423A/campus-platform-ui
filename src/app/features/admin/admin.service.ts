import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserRole } from '../../core/models/user-role';
import { Observable } from 'rxjs';

export interface InvitationPayload {
  email: string;
  role: UserRole;
}

export interface Room {
  id: number;
  name: string;
  seats: number;
  examSeats: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/admin';
  private roomsUrl = environment.apiUrl + '/rooms';

  inviteUser(email: string, role: UserRole): Observable<void> {
    const payload: InvitationPayload = { email, role };
    return this.http.post<void>(`${this.apiUrl}/invite`, payload);
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.roomsUrl);
  }

  createRoom(room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.post<Room>(this.roomsUrl, room);
  }

  updateRoom(id: number, room: Omit<Room, 'id'>): Observable<Room> {
    return this.http.put<Room>(`${this.roomsUrl}/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.roomsUrl}/${id}`);
  }
}
