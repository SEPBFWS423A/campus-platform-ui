import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '../../../core/models/user-role';
import { AdminService } from '../admin.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslateModule,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private translate = inject(TranslateService);

  roles = [UserRole.Student, UserRole.Lecturer, UserRole.Admin];

  isLoading = signal(false);
  message = signal<string | null>(null);

  invitationForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [this.roles[0], Validators.required],
  });

  sendInvitation() {
    if (this.invitationForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);
    const { email, role } = this.invitationForm.getRawValue();

    this.adminService.inviteUser(email!, role!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.translate.get('userManagement.invitationSuccess', { email }).subscribe((res: string) => {
          this.message.set(res);
        });
        this.invitationForm.reset({ role: this.roles[0] });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.translate.get('userManagement.invitationFailure').subscribe((res: string) => {
          this.message.set(err.error?.message || res);
        });
      },
    });
  }
}
