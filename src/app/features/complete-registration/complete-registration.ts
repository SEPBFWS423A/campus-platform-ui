import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-complete-registration',
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
  templateUrl: './complete-registration.html',
  styleUrl: './complete-registration.scss',
})
export class CompleteRegistration implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  token: string | null = null;
  isLoading = signal(false);
  isRedirecting = signal(false);
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
      this.translate.get('completeRegistration.invalidToken').subscribe((res: string) => {
        this.message.set(res);
      });
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
        this.isRedirecting.set(true);
        this.translate.get('completeRegistration.successMessage').subscribe((res: string) => {
          this.message.set(res);
        });
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.translate.get('completeRegistration.failureMessage').subscribe((res: string) => {
          this.message.set(err.error?.message || res);
        });
      },
    });
  }
}
