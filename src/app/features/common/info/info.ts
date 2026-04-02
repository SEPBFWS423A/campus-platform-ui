import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {faq} from '../../../core/models/faq';
import {FaqService} from '../../../core/services/faq.service';


@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './info.html',
  styleUrl: './info.scss'
})
export class InfoComponent implements OnInit {
  private readonly faqService = inject(FaqService);

  readonly searchTerm = signal('');
  readonly openFaqId = signal<number | null>(null);
  readonly faqs = signal<faq[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filteredFaqs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    const visibleFaqs = this.faqs();

    if (!term) {
      return visibleFaqs;
    }

    return visibleFaqs.filter((faq) =>
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.loading.set(true);
    this.error.set(null);

    this.faqService.getVisibleFaqs().subscribe({
      next: (faqs) => {
        this.faqs.set(
          [...faqs].sort((a, b) => a.sortOrder - b.sortOrder)
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der FAQs', err);
        this.error.set('Die FAQs konnten nicht geladen werden.');
        this.loading.set(false);
      }
    });
  }

  toggleFaq(id: number): void {
    this.openFaqId.set(this.openFaqId() === id ? null : id);
  }

  isOpen(id: number): boolean {
    return this.openFaqId() === id;
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}
