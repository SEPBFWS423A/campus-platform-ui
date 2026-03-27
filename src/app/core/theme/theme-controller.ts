import {Injectable, inject, effect, computed, linkedSignal} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeBrightness, ThemeColorPalette } from './theme-options';
import { Auth } from '../auth/auth';
import { UserService } from '../user/user.service';
import { NotificationService } from '../services/notification.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class ThemeController {
  private document = inject(DOCUMENT);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private htmlElement = this.document.documentElement;

  private userTheme = computed(() => this.userService.profile()?.theme as ThemeColorPalette | undefined);
  private userBrightness = computed(() => this.userService.profile()?.brightness as ThemeBrightness | undefined);
  private userLanguage = computed(() => this.userService.profile()?.language as string | undefined);

  activeTheme = linkedSignal<ThemeColorPalette>(() => this.userTheme() ?? ThemeColorPalette.azure);
  activeBrightness = linkedSignal<ThemeBrightness>(() => this.userBrightness() ?? ThemeBrightness.light);
  activeLanguage = linkedSignal<string>(() => this.userLanguage() ?? navigator.language.split('-')[0] ?? 'en');

  constructor() {
    effect(() => {
      const theme = this.activeTheme();
      const brightness = this.activeBrightness();
      const language = this.activeLanguage();

      this.htmlElement.classList.remove(...Object.values(ThemeColorPalette));
      this.htmlElement.classList.add(theme);
      this.htmlElement.style.colorScheme = brightness;

      if (language) {
        this.translate.use(language);
      }
    });
  }

  setBrightness(brightness: ThemeBrightness, save = true) {
    this.activeBrightness.set(brightness);
    if (save && this.auth.isLoggedIn()) {
      this.saveSettings();
    }
  }

  setColorTheme(newTheme: ThemeColorPalette, save = true) {
    this.activeTheme.set(newTheme);
    if (save && this.auth.isLoggedIn()) {
      this.saveSettings();
    }
  }

  setLanguage(language: string, save = true) {
    this.activeLanguage.set(language);
    if (save && this.auth.isLoggedIn()) {
      this.saveSettings();
    }
  }

  private saveSettings() {
    this.userService.updatePreferences(this.activeTheme(), this.activeBrightness(), this.activeLanguage()).subscribe({
      next: () => this.notificationService.showSuccess('common.success')
    });
  }
}
