import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { PublicService } from '../../../core/public/public.service';
import { JobPosting, JobType } from '../../admin/job-postings/job-postings';

@Component({
  selector: 'app-public-jobs',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './public-jobs.html',
  styleUrl: './public-jobs.scss'
})
export class PublicJobs implements OnInit, OnDestroy {
  private readonly svc = inject(PublicService);

  postings = signal<JobPosting[]>([]);
  loading  = signal(true);
  error    = signal<string | null>(null);
  expanded = signal<Set<number>>(new Set());

  filterType = signal<string>('ALL');

  typeOptions = [
    { value: 'ALL',                     label: 'Alle Stellen' },
    { value: 'VOLLZEIT',                label: 'Vollzeit' },
    { value: 'TEILZEIT',                label: 'Teilzeit' },
    { value: 'LEHRAUFTRAG',             label: 'Lehrauftrag' },
    { value: 'STUDENTISCHE_HILFSKRAFT', label: 'Stud. Hilfskraft' },
    { value: 'PRAKTIKUM',               label: 'Praktikum' }
  ];

  filteredPostings = computed(() => {
    const t = this.filterType();
    return this.postings().filter(p => t === 'ALL' || p.type === t);
  });

  ngOnInit(): void {
    document.body.style.overflow = 'auto';
    this.svc.getActiveJobPostings().subscribe({
      next: data  => { this.postings.set(data); this.loading.set(false); },
      error: _err => { this.error.set('Stellenausschreibungen konnten nicht geladen werden.'); this.loading.set(false); }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  toggleExpand(id: number): void {
    this.expanded.update(s => {
      const next = new Set(s);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  setFilter(type: string): void {
    this.filterType.set(type);
  }

  getTypeLabel(type: JobType): string {
    const map: Record<JobType, string> = {
      VOLLZEIT:               'Vollzeit',
      TEILZEIT:               'Teilzeit',
      LEHRAUFTRAG:            'Lehrauftrag',
      STUDENTISCHE_HILFSKRAFT:'Stud. Hilfskraft',
      PRAKTIKUM:              'Praktikum'
    };
    return map[type] ?? type;
  }

  getTypeIcon(type: JobType): string {
    const map: Record<JobType, string> = {
      VOLLZEIT:               'work',
      TEILZEIT:               'schedule',
      LEHRAUFTRAG:            'school',
      STUDENTISCHE_HILFSKRAFT:'person',
      PRAKTIKUM:              'co_present'
    };
    return map[type] ?? 'work';
  }

  isDeadlineSoon(deadline: string): boolean {
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
  }

  isDeadlinePassed(deadline: string): boolean {
    return new Date(deadline).getTime() < Date.now();
  }
}
