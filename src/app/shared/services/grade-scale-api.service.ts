import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GradeScaleResponse } from '../models/grade-scale.model';

@Injectable({
  providedIn: 'root'
})
export class GradeScaleApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  getGradeScale(): Observable<GradeScaleResponse> {
    return this.http.get<GradeScaleResponse>(`${this.apiUrl}/users/grade-scale`);
  }
}
