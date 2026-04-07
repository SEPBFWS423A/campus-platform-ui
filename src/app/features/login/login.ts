import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Auth } from '../../core/auth/auth';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { PublicService } from '../../core/public/public.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports: [
    TranslatePipe,
    DatePipe,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    RouterLink,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true
})
export class Login implements OnInit {
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  public publicService = inject(PublicService);

  currentDate = new Date();

  email = signal('');
  password = signal('');

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  private returnUrl: string | null = null;

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  onLogin() {
    this.errorMessage.set(null);
    if (!this.email()) {
      return;
    }

    this.isLoading.set(true);
    this.auth.login(this.email(), this.password(), this.returnUrl).subscribe({
      next: () => {
        this.notificationService.showSuccess('login.loginSuccess');
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage.set(err.error?.message || 'login.error');
        this.isLoading.set(false);
      }
    });
  }
}
