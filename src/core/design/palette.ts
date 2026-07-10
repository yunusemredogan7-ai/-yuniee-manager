// Extended palette tokens. The core 10 tokens (bg, surface, surfaceMuted, text,
// subtext, border, primary, success, warning, danger) stay backward-compatible
// with AppSettingsContext.AppColors. Extra tokens enable richer UI primitives.

export type ExtendedColors = {
    // Core 10 (consumed by existing screens)
    bg: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    // Extended
    surfaceElevated: string;   // cards floating above surface
    surfaceSunken: string;     // inputs / wells
    divider: string;           // hairline divider, lighter than border
    textMuted: string;         // tertiary text (timestamps, helpers)
    textInverse: string;       // text on primary-filled buttons
    primarySoft: string;       // tinted primary bg for chips/badges
    primaryStrong: string;     // hover/pressed primary
    accent: string;            // secondary accent for highlights
    successSoft: string;
    warningSoft: string;
    dangerSoft: string;
    overlay: string;           // modal scrim
    focusRing: string;
};

export const lightPalette: ExtendedColors = {
    // Core (refined — slightly cooler, more neutral)
    bg: '#f5f6fa',
    surface: '#ffffff',
    surfaceMuted: '#f1f3f8',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#e3e6ee',
    primary: '#5867d8',
    success: '#3f9971',
    warning: '#d18a16',
    danger: '#c24747',
    // Extended
    surfaceElevated: '#ffffff',
    surfaceSunken: '#eef0f6',
    divider: '#eef0f6',
    textMuted: '#94a3b8',
    textInverse: '#ffffff',
    primarySoft: '#eceeff',
    primaryStrong: '#4654c2',
    accent: '#7c8aff',
    successSoft: '#e3f3eb',
    warningSoft: '#fbeed5',
    dangerSoft: '#f7dede',
    overlay: 'rgba(15, 23, 42, 0.45)',
    focusRing: 'rgba(88, 103, 216, 0.35)',
};

export const darkPalette: ExtendedColors = {
    // Core
    bg: '#0b0d12',
    surface: '#14171f',
    surfaceMuted: '#1a1e28',
    text: '#f4f6fb',
    subtext: '#9aa3b3',
    border: '#262b36',
    primary: '#8f9aff',
    success: '#6fc89a',
    warning: '#e2a84a',
    danger: '#e27d7d',
    // Extended
    surfaceElevated: '#1c2029',
    surfaceSunken: '#0f1218',
    divider: '#20242e',
    textMuted: '#6b7384',
    textInverse: '#0b0d12',
    primarySoft: '#252a44',
    primaryStrong: '#a6afff',
    accent: '#a5afff',
    successSoft: '#1d2e26',
    warningSoft: '#2e2719',
    dangerSoft: '#2e1d1d',
    overlay: 'rgba(0, 0, 0, 0.6)',
    focusRing: 'rgba(143, 154, 255, 0.4)',
};
