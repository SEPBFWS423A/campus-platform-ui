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
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/user/user.service';
import { PublicService } from '../../core/public/public.service';
import { MatIconModule } from '@angular/material/icon';

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
    MatSelectModule,
    MatIconModule,
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
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public publicService = inject(PublicService);

  token: string | null = null;
  email: string | null = null;
  isLoading = signal(false);
  isRedirecting = signal(false);
  message = signal<string | null>(null);

  salutations = ['MR', 'MS', 'MX'];
  academicTitles = ['DR', 'PROF', 'PROF_DR'];

  form = this.fb.group({
    salutation: [''],
    title: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
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
    this.email = this.route.snapshot.queryParamMap.get('email');
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
    const { salutation, title, firstName, lastName, password } = this.form.getRawValue();
    
    this.auth.completeRegistration(this.token, salutation!, title!, firstName!, lastName!, password!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isRedirecting.set(true);
        this.notificationService.showSuccess('completeRegistration.successMessage');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading.set(false);
      },
    });
  }
}
