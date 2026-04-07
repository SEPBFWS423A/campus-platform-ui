import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PublicService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/public`;

  private _universityName = signal<string>('');
  public readonly universityName = this._universityName.asReadonly();

  getUniversityName(): Observable<{ name: string }> {
    return this.http.get<{ name: string }>(`${this.apiUrl}/university-name`).pipe(
      tap(res => this._universityName.set(res.name))
    );
  }
}
