import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  showSuccess(messageKey: string, interpolateParams?: object) {
    this.translate.get(messageKey, interpolateParams).subscribe((message: string) => {
      this.snackBar.open(message, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    });
  }

  showError(messageKey: string) {
    this.translate.get(messageKey).subscribe((message: string) => {
      this.snackBar.open(message, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    });
  }
}
