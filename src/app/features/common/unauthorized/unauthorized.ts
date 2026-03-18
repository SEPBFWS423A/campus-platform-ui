import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {Auth} from '../../../core/auth/auth';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-unauthorized',
  imports: [
    MatIcon,
    MatButton,
    TranslatePipe
  ],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.scss',
})
export class Unauthorized {
  private router = inject(Router);
  private auth = inject(Auth);

  goHome() {
    const user = this.auth.currentUser();
    this.router.navigate([user ? `/${user}` : '/login']);
  }
}
