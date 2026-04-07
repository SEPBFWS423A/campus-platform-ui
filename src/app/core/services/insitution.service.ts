import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InstitutionInfo } from '../models/institution-info.model';

@Injectable({
  providedIn: 'root'
})
export class InstitutionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getInstitutionInfo(): Observable<InstitutionInfo> {
    return this.http.get<InstitutionInfo>(`${this.apiUrl}/users/institution`);
  }
}
