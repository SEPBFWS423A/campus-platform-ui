import { inject, Injectable, Injector } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private injector = inject(Injector);

  private get translate(): TranslateService {
    return this.injector.get(TranslateService);
  }

  showSuccess(messageKey: string, interpolateParams?: object) {
    this.translate.get(messageKey, interpolateParams).subscribe((message: string) => {
      this.openSnackBar(message, 'success-snackbar', 3000);
    });
  }

  showError(messageKey: string, interpolateParams?: object) {
    this.translate.get(messageKey, interpolateParams).subscribe((message: string) => {
      this.openSnackBar(message, 'error-snackbar', 5000);
    });
  }

  private openSnackBar(message: string, panelClass: string, duration: number) {
    this.snackBar.open(message, this.translate.instant('common.close') || 'Close', {
      duration,
      panelClass: [panelClass],
    });
  }
}
