import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'error.generic';
      
      if (error.status === 0) {
        errorMessage = 'error.no_connection';
      } else if (error.status === 401) {
        errorMessage = 'error.unauthorized';
      } else if (error.status === 403) {
        errorMessage = 'error.forbidden';
      } else if (error.status >= 500) {
        errorMessage = 'error.server_error';
      } else if (error.error?.message) {
        // Use backend error message if available, but pass it as key (it might be a key or raw text)
        errorMessage = error.error.message;
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);
    })
  );
};
