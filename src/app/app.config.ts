import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { notificationInterceptor } from './core/interceptors/notification.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(routes),
    importProvidersFrom(MatSnackBarModule),
    provideHttpClient(withInterceptors([authInterceptor, notificationInterceptor])),
    provideTranslateService({
      lang: navigator.language.split('-')[0],
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      })
    })
  ]
};
