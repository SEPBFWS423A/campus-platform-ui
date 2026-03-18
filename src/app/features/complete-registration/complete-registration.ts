import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './complete-registration.html',
})
export class CompleteRegistration implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token: string | null = null;
  isLoading = signal(false);
  message = signal<string | null>(null);

  form = this.fb.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(group: any) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.message.set('Invalid or missing invitation token.');
    }
  }

  completeRegistration() {
    if (this.form.invalid || !this.token) {
      return;
    }

    this.isLoading.set(true);
    this.message.set(null);
    const { firstname, lastname, password } = this.form.getRawValue();

    this.auth.completeRegistration(this.token, firstname!, lastname!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.message.set('Registration complete! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.message.set(err.error?.message || 'This invitation is invalid or has expired.');
      },
    });
  }
}
