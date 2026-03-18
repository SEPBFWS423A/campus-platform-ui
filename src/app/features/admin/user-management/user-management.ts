import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserRole } from '../../../core/models/user-role';
import { AdminService } from '../admin.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  roles = [UserRole.Student, UserRole.Lecturer];

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
        this.message.set(`Invitation sent successfully to ${email}.`);
        this.invitationForm.reset({ role: this.roles[0] });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.message.set(err.error?.message || 'Failed to send invitation.');
      },
    });
  }
}
