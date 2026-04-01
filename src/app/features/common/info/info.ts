import {faqFacts} from '../../../core/models/faqFact';
import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-info',
  imports: [CommonModule, FormsModule],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info {
  readonly searchTerm = signal('');
  readonly openFaqId = signal<number | null>(null);

  readonly faqs = signal<faqFacts[]>([
    {
      id: 1,
      category: 'Konto',
      question: 'Wie melde ich mich auf der Campus-Plattform an?',
      answer: 'Melden Sie sich mit Ihrer registrierten E-Mail-Adresse und Ihrem Passwort auf der Login-Seite an.'
    },
    {
      id: 2,
      category: 'Konto',
      question: 'Was kann ich tun, wenn ich mein Passwort vergessen habe?',
      answer: 'Nutzen Sie auf der Login-Seite die Funktion „Passwort vergessen“, um ein neues Passwort anzufordern.'
    },
    {
      id: 3,
      category: 'Studium',
      question: 'Wo finde ich meine Veranstaltungen?',
      answer: 'Ihre Veranstaltungen werden im jeweiligen Bereich der Plattform nach dem Login angezeigt.'
    },
    {
      id: 4,
      category: 'Prüfungen',
      question: 'Wo finde ich Informationen zu Prüfungen?',
      answer: 'Prüfungsrelevante Informationen finden Sie im Bereich Prüfungsamt oder in den zugehörigen Veranstaltungsinformationen.'
    },
    {
      id: 5,
      category: 'Technik',
      question: 'Warum lädt eine Seite nicht richtig?',
      answer: 'Bitte aktualisieren Sie die Seite. Falls das Problem bestehen bleibt, prüfen Sie Ihre Internetverbindung oder kontaktieren Sie den Support.'
    }
  ]);

  readonly filteredFaqs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.faqs();
    }

    return this.faqs().filter((faq) =>
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.category.toLowerCase().includes(term)
    );
  });

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
