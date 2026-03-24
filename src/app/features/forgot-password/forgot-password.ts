import {Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Auth} from '../../core/auth/auth';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslateModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  linkSent = signal(false);
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
        this.linkSent.set(true);
        this.notificationService.showSuccess('forgotPassword.successMessage');
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Forgot password failed:', err);
      }
    });
  }
}
