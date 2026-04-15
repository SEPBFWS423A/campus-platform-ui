import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StudentApplicationsService {

  constructor(private http: HttpClient) {}

  getPrograms() {
    return this.http.get<any[]>('/api/applications/programs');
  }

  getMyApplications() {
    // Kein studentId mehr – kommt aus dem JWT via @AuthenticationPrincipal
    return this.http.get<any[]>('/api/applications/my');
  }

  apply(form: any) {
    const fd = new FormData();
    fd.append('programId', form.programId);
    fd.append('motivation', form.motivation || '');
    fd.append('priority', form.priority.toString());
    if (form.file) fd.append('file', form.file);

    return this.http.post<any>('/api/applications/apply', fd);
  }
}