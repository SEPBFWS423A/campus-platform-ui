import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StudyProgram {
  id: number;
  name: string;
  faculty: string;
  duration: string;
  degree: string;
  spots: number;
}

@Component({
  selector: 'app-student-applications',
  imports: [CommonModule, FormsModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
})
export class StudentApplications {
  applied: number[] = [];

  programs: StudyProgram[] = [
    { id: 1, name: 'Wirtschaftsinformatik', faculty: 'Wirtschaft & Informatik', duration: '6 Semester', degree: 'B.Sc.', spots: 60 },
    { id: 2, name: 'Informatik', faculty: 'Informatik', duration: '6 Semester', degree: 'B.Sc.', spots: 80 },
    { id: 3, name: 'BWL', faculty: 'Wirtschaft', duration: '6 Semester', degree: 'B.A.', spots: 100 },
    { id: 4, name: 'Data Science', faculty: 'Informatik', duration: '4 Semester', degree: 'M.Sc.', spots: 30 },
    { id: 5, name: 'Digital Marketing', faculty: 'Wirtschaft', duration: '4 Semester', degree: 'M.A.', spots: 25 },
  ];

  apply(id: number): void {
    if (!this.applied.includes(id)) {
      this.applied.push(id);
    }
  }

  withdraw(id: number): void {
    this.applied = this.applied.filter(a => a !== id);
  }

  hasApplied(id: number): boolean {
    return this.applied.includes(id);
  }
}