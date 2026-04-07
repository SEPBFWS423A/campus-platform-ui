import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {faqModel} from '../../../core/models/faq.model';
import {InstitutionInfo} from '../../../core/models/institution-info.model';
import {FaqService} from '../../../core/services/faq.service';
import  {InstitutionService} from '../../../core/services/insitution.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './info.html',
  styleUrl: './info.scss'
})
export class InfoComponent implements OnInit {
  faqs: faqModel[] = [];
  institution: InstitutionInfo | null = null;

  faqLoading = true;
  institutionLoading = true;

  faqError: string | null = null;
  institutionError: string | null = null;

  searchTerm = '';
  openFaqId: number | null = null;

  constructor(
    private faqService: FaqService,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    this.loadInstitution();
    this.loadFaqs();
  }

  loadInstitution(): void {
    this.institutionLoading = true;
    this.institutionError = null;

    this.institutionService.getInstitutionInfo().subscribe({
      next: (institution) => {
        this.institution = institution;
        this.institutionLoading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Institutionsdaten', err);
        this.institutionError = 'info.loadInstitutionError';
        this.institutionLoading = false;
      }
    });
  }

  loadFaqs(): void {
    this.faqLoading = true;
    this.faqError = null;

    this.faqService.getVisibleFaqs().subscribe({
      next: (faqs) => {
        this.faqs = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        this.faqLoading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der FAQs', err);
        this.faqError = 'info.loadFaqError';
        this.faqLoading = false;
      }
    });
  }

  get pageTitle(): string {
    return this.institution ? `${this.institution.universityName} Info` : 'Info';
  }

  get pageSubtitle(): string {
    return this.institution
      ? this.institution.city
      : '';
  }

  get filteredFaqs(): faqModel[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.faqs;
    }

    return this.faqs.filter((faq) =>
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  }

  toggleFaq(id: number): void {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  isOpen(id: number): boolean {
    return this.openFaqId === id;
  }
}

//optinoal erweitern: Mehrsprachige Fragen für autom. Übersetzung bei Sprachumstellung
