import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { faq } from '../models/faq';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getVisibleFaqs(): Observable<faq[]> {
    return this.http.get<faq[]>(`${this.apiUrl}/users/faqs`);
  }
}
