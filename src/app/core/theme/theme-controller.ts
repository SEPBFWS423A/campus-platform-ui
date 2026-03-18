import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ThemeBrightness, ThemeColorPalette } from './theme-options';

@Injectable({ providedIn: 'root' })
export class ThemeController {
    private document = inject(DOCUMENT);
    private htmlElement = this.document.documentElement;

    activeTheme = (localStorage.getItem('theme') as ThemeColorPalette) || ThemeColorPalette.azure;
    activeBrightness = (localStorage.getItem('brightness') as ThemeBrightness) || ThemeBrightness.light;

    constructor() {
        this.setColorTheme(this.activeTheme);
        this.setBrightness(this.activeBrightness);
    }

    setBrightness(brightness: ThemeBrightness) {
        this.activeBrightness = brightness;
        this.htmlElement.style.colorScheme = brightness;
        localStorage.setItem('brightness', brightness);
    }

    setColorTheme(newTheme: ThemeColorPalette) {
        this.activeTheme = newTheme;
        this.htmlElement.classList.remove(...Object.values(ThemeColorPalette));
        this.htmlElement.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
    }
}