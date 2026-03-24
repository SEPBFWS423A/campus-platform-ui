import {Injectable, inject, effect, computed, linkedSignal} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeBrightness, ThemeColorPalette } from './theme-options';
import { Auth } from '../auth/auth';
import { UserService } from '../user/user.service';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class ThemeController {
  private document = inject(DOCUMENT);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private htmlElement = this.document.documentElement;

  private userTheme = computed(() => this.userService.profile()?.theme as ThemeColorPalette | undefined);
  private userBrightness = computed(() => this.userService.profile()?.brightness as ThemeBrightness | undefined);

  activeTheme = linkedSignal<ThemeColorPalette>(() => this.userTheme() ?? ThemeColorPalette.azure);
  activeBrightness = linkedSignal<ThemeBrightness>(() => this.userBrightness() ?? ThemeBrightness.light);

  constructor() {
    effect(() => {
      const theme = this.activeTheme();
      const brightness = this.activeBrightness();

      this.htmlElement.classList.remove(...Object.values(ThemeColorPalette));
      this.htmlElement.classList.add(theme);
      this.htmlElement.style.colorScheme = brightness;
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

  private saveSettings() {
    this.userService.updateThemeSettings(this.activeTheme(), this.activeBrightness()).subscribe({
      next: () => this.notificationService.showSuccess('common.success')
    });
  }
}
