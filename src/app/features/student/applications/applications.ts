import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentApplicationsService } from '../services/student-applications.service';

@Component({
  selector: 'app-student-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './applications.html',
  styleUrls: ['./applications.scss']
})
export class Applications {
  today = new Date();

  loading = signal(true);
  error = signal<string | null>(null);
  programs = signal<any[]>([]);
  myApplications = signal<any[]>([]);

  form = {
    programId: '',
    motivation: '',
    priority: 1,
    file: null
  };

  constructor(private service: StudentApplicationsService) {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.service.getPrograms().subscribe({
      next: (data) => {
        this.programs.set(data);
        this.loadMyApplications();
      },
      error: () => {
        this.error.set('Fehler beim Laden');
        this.loading.set(false);
      }
    });
  }

loadMyApplications() {
  this.service.getMyApplications().subscribe({
    next: (apps) => {
      this.myApplications.set(apps);
      this.loading.set(false);
    },
    error: () => {
      // getMyApplications schlägt fehl (z.B. 500), aber programmes wurden geladen
      this.myApplications.set([]);
      this.loading.set(false);
    }
  });
}

  onFileSelected(event: any) {
    this.form.file = event.target.files[0];
  }

  submit() {
    this.service.apply(this.form).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Fehler beim Absenden')
    });
  }
}
