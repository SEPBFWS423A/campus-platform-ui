import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type AppStatus = 'pending' | 'accepted' | 'rejected';

interface Application {
  id: number;
  studentName: string;
  studentNumber: string;
  program: string;
  date: string;
  status: AppStatus;
}

@Component({
  selector: 'app-admin-applications',
  imports: [CommonModule],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
})
export class AdminApplications {
  applications: Application[] = [
    { id: 1, studentName: 'Max Mustermann', studentNumber: 'S10001', program: 'Wirtschaftsinformatik', date: '10.04.2026', status: 'pending' },
    { id: 2, studentName: 'Anna Schmidt', studentNumber: 'S10002', program: 'Data Science', date: '11.04.2026', status: 'pending' },
    { id: 3, studentName: 'Lukas Bauer', studentNumber: 'S10003', program: 'Informatik', date: '09.04.2026', status: 'accepted' },
    { id: 4, studentName: 'Sara Yilmaz', studentNumber: 'S10004', program: 'BWL', date: '08.04.2026', status: 'rejected' },
    { id: 5, studentName: 'Tom Fischer', studentNumber: 'S10005', program: 'Digital Marketing', date: '12.04.2026', status: 'pending' },
  ];

  accept(id: number): void {
    const app = this.applications.find(a => a.id === id);
    if (app) app.status = 'accepted';
  }

  reject(id: number): void {
    const app = this.applications.find(a => a.id === id);
    if (app) app.status = 'rejected';
  }

  get pending() { return this.applications.filter(a => a.status === 'pending').length; }
  get accepted() { return this.applications.filter(a => a.status === 'accepted').length; }
  get rejected() { return this.applications.filter(a => a.status === 'rejected').length; }
}