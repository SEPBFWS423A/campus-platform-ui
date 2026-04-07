import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FaqModel } from '../models/faqModel';
import { environment } from '../../../environments/environment';
import { TranslateService } from '@ngx-translate/core';


@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);

  getVisibleFaqs(lang?: string): Observable<FaqModel[]> {
    const resolvedLang = (
      lang ||
      this.translate.getCurrentLang() ||
      this.translate.getFallbackLang() ||
      'de'
    ).toLowerCase().trim();

    return this.http.get<FaqModel[]>(`${this.apiUrl}/users/faqs`, {
      params: { lang: resolvedLang }
    });
  }
}
