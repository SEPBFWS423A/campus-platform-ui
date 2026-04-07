import {Component, inject, signal, OnInit, OnDestroy} from '@angular/core';
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
import { UserService } from '../../core/user/user.service';
import { PublicService } from '../../core/public/public.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

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
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public publicService = inject(PublicService);

  isLoading = signal(false);
  linkSent = signal(false);
  message = signal<string | null>(null);
  countdown = signal(0);
  
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  
  private timerInterval?: any;
  private readonly COOLDOWN_MS = 10 * 60 * 1000;
  private readonly STORAGE_KEY = 'last_password_reset_request';

  ngOnInit() {
    this.checkCooldown();
  }

  private checkCooldown() {
    const lastRequest = localStorage.getItem(this.STORAGE_KEY);
    if (lastRequest) {
      const diff = Date.now() - parseInt(lastRequest, 10);
      if (diff < this.COOLDOWN_MS) {
        this.startCountdown(this.COOLDOWN_MS - diff);
      }
    }
  }

  private startCountdown(durationMs: number) {
    this.countdown.set(Math.ceil(durationMs / 1000));
    
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      const remaining = this.countdown() - 1;
      this.countdown.set(remaining);
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.countdown.set(0);
      }
    }, 1000);
  }

  get formattedCountdown(): string {
    const minutes = Math.floor(this.countdown() / 60);
    const seconds = this.countdown() % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  sendResetLink() {
    if (this.form.invalid || this.isLoading() || this.countdown() > 0) {
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);

    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.linkSent.set(true);
        this.message.set('forgotPassword.successMessage');
        this.notificationService.showSuccess('forgotPassword.successMessage');
        
        // Start cooldown
        localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
        this.startCountdown(this.COOLDOWN_MS);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorKey = err.error?.messageKey || 'forgotPassword.failureMessage';
        this.message.set(errorKey);
        this.notificationService.showError(errorKey);
        console.error('Forgot password failed:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
