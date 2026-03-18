import {Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Auth} from '../../core/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  isLoading = signal(false);
  message = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  sendResetLink() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);

    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.message.set('If an account with that email exists, a password reset link has been sent.');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.message.set(err.error?.message || 'An error occurred. Please try again.');
        console.error('Forgot password failed:', err);
      }
    });
  }
}
