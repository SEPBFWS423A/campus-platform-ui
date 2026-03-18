import { Injectable, inject, effect, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeBrightness, ThemeColorPalette } from './theme-options';
import { Auth } from '../auth/auth';
import { UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class ThemeController {
    private document = inject(DOCUMENT);
    private auth = inject(Auth);
    private userService = inject(UserService);
    private htmlElement = this.document.documentElement;

    private userTheme = computed(() => this.auth.currentUser()?.theme as ThemeColorPalette | undefined);
    private userBrightness = computed(() => this.auth.currentUser()?.brightness as ThemeBrightness | undefined);

    activeTheme: ThemeColorPalette = this.userTheme() || ThemeColorPalette.azure;
    activeBrightness: ThemeBrightness = this.userBrightness() || ThemeBrightness.light;

    constructor() {
        this.setColorTheme(this.activeTheme, false);
        this.setBrightness(this.activeBrightness, false);

        effect(() => {
            const theme = this.userTheme();
            const brightness = this.userBrightness();
            if (theme) this.setColorTheme(theme, false);
            if (brightness) this.setBrightness(brightness, false);
        });
    }

    setBrightness(brightness: ThemeBrightness, save = true) {
        this.activeBrightness = brightness;
        this.htmlElement.style.colorScheme = brightness;
        if (save && this.auth.isLoggedIn()) {
            this.saveSettings();
        }
    }

    setColorTheme(newTheme: ThemeColorPalette, save = true) {
        this.activeTheme = newTheme;
        this.htmlElement.classList.remove(...Object.values(ThemeColorPalette));
        this.htmlElement.classList.add(newTheme);
        if (save && this.auth.isLoggedIn()) {
            this.saveSettings();
        }
    }

    private saveSettings() {
        this.userService.updateThemeSettings(this.activeTheme, this.activeBrightness).subscribe({
            next: () => console.log('Theme settings saved to backend.'),
            error: (err) => console.error('Failed to save theme settings:', err)
        });
    }
}
