import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/user/user.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class ChangePassword {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);

  form = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  changePassword() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    const { oldPassword, newPassword } = this.form.getRawValue();

    this.userService.changePassword(oldPassword!, newPassword!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(`Error: ${err.error?.message || 'Failed to change password'}`, 'Close', { duration: 5000 });
        console.error('Failed to change password:', err);
      }
    });
  }
}
