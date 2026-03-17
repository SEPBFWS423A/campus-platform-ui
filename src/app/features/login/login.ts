import {Component, inject, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {DatePipe} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {Auth} from '../../core/auth/auth';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    TranslatePipe,
    DatePipe,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true
})
export class Login {
  private auth = inject(Auth);

  currentDate = new Date();

  username = signal('');
  password = signal('');

  loginError = signal(false);
  isLoading = signal(false);

  onLogin() {
    this.loginError.set(false);

    if (this.username()) {
      this.isLoading.set(true);
      const success = this.auth.login(this.username());

      if (!success) {
        this.loginError.set(true);
        this.isLoading.set(false);
      }
    }
  }
}
