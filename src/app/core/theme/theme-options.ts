export enum ThemeBrightness {
    dark = 'dark',
    light = 'light'
}

export enum ThemeColorPalette {
    red = 'theme-red',
    green = 'theme-green',
    blue = 'theme-blue',
    yellow = 'theme-yellow',
    cyan = 'theme-cyan',
    magenta = 'theme-magenta',
    orange = 'theme-orange',
    azure = 'theme-azure',
    violet = 'theme-violet',
    rose = 'theme-rose'
}

export interface ThemeOption {
    value: ThemeColorPalette;
    colorHex: string;
}

export const THEME_PALETTE_OPTIONS: ThemeOption[] = [
    { value: ThemeColorPalette.azure, colorHex: '#007fff' },
    { value: ThemeColorPalette.blue, colorHex: '#2196f3' },
    { value: ThemeColorPalette.cyan, colorHex: '#21f3e2' },
    { value: ThemeColorPalette.green, colorHex: '#4caf50' },
    { value: ThemeColorPalette.yellow, colorHex: '#f0f321' },
    { value: ThemeColorPalette.orange, colorHex: '#f39f21' },
    { value: ThemeColorPalette.red, colorHex: '#f44336' },
    { value: ThemeColorPalette.rose, colorHex: '#f8156c' },
    { value: ThemeColorPalette.magenta, colorHex: '#ec21f3' },
    { value: ThemeColorPalette.violet, colorHex: '#8f00ff' },
];

