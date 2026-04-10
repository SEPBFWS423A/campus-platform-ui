import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'error.generic';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'error.no_connection';
      } else if (error.status === 401) {
        errorMessage = 'error.unauthorized';
      } else if (error.status === 403) {
        errorMessage = 'error.forbidden';
      } else if (error.status >= 500) {
        errorMessage = 'error.server_error';
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);
    })
  );
};
