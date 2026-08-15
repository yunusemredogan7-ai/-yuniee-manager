/**
 * Single source of truth for design tokens: spacing, radius, typography,
 * minimum touch target size, and semantic color. Nothing outside this file
 * should declare a raw hex value or an ad hoc spacing/font-size number —
 * screens and components import from here (directly, or via
 * `useAppSettings().colors` for the theme-resolved color set).
 */

/* ═══════════════════════════════════════════
   Spacing — 4pt base scale. Use for every
   padding / margin / gap value in the app.
   ═══════════════════════════════════════════ */

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

export type SpacingToken = keyof typeof SPACING;

/* ═══════════════════════════════════════════
   Radius
   ═══════════════════════════════════════════ */

export const RADIUS = {
    sm: 8,    // controls: inputs, buttons, chips
    md: 12,   // cards, sheets, modals
    pill: 999, // fully rounded: pills, avatars, dots
} as const;

export type RadiusToken = keyof typeof RADIUS;

/* ═══════════════════════════════════════════
   Typography — five roles only. Never go
   below `caption` (11). Body and anything
   larger than body gets a 1.4x line height.
   ═══════════════════════════════════════════ */

export const TYPOGRAPHY = {
    title: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    heading: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
    body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    label: { fontSize: 13, fontWeight: '500' },
    caption: { fontSize: 11, fontWeight: '400' },
} as const satisfies Record<string, { fontSize: number; fontWeight: '400' | '500' | '600'; lineHeight?: number }>;

export type TypographyRole = keyof typeof TYPOGRAPHY;

/* ═══════════════════════════════════════════
   Touch — every interactive element needs a
   44x44 hit area. Where the visible control is
   smaller, pad it out with hitSlop instead of
   growing the control itself.
   ═══════════════════════════════════════════ */

export const TOUCH = {
    minSize: 44,
} as const;

/** hitSlop needed to bring a control of `size` px up to the 44x44 minimum. */
export function hitSlopFor(size: number) {
    const pad = Math.max(0, Math.ceil((TOUCH.minSize - size) / 2));
    return { top: pad, bottom: pad, left: pad, right: pad };
}

/** hitSlop needed to bring a control of `width` x `height` px up to the 44x44 minimum. */
export function hitSlopForSize(width: number, height: number) {
    return {
        top: Math.max(0, Math.ceil((TOUCH.minSize - height) / 2)),
        bottom: Math.max(0, Math.ceil((TOUCH.minSize - height) / 2)),
        left: Math.max(0, Math.ceil((TOUCH.minSize - width) / 2)),
        right: Math.max(0, Math.ceil((TOUCH.minSize - width) / 2)),
    };
}

/* ═══════════════════════════════════════════
   Color — semantic names only. Every screen
   and component reads colors through these
   names, never a literal hex.

   Status colors are the only colors in the
   app: nothing decorative gets its own hue.
   Text drawn on a status background always
   uses that status's `.fg`, never `text.primary`.
   ═══════════════════════════════════════════ */

export type StatusTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export type ColorTokens = {
    bg: {
        page: string;
        surface: string;
        raised: string;
    };
    text: {
        primary: string;
        secondary: string;
        muted: string;
    };
    border: {
        default: string;
        strong: string;
    };
    status: Record<StatusTone, { bg: string; fg: string }>;
    accent: {
        bg: string;
        fg: string;
    };
};

/** Fixed elevation-shadow color. Shadows render as black at reduced opacity
 * in both themes (there is no meaningful "light-mode shadow" hue) — this is
 * a rendering primitive, not a themed color, so it lives here as a single
 * named constant rather than as a literal in every screen. */
export const SHADOW_COLOR = '#000000';

/** Fixed modal/sheet backdrop scrim. Like `SHADOW_COLOR`, a backdrop dims
 * whatever is behind it toward black in both themes — it isn't a themed
 * surface, so it's a rendering primitive here rather than a `bg.*` role. */
export const OVERLAY_SCRIM = 'rgba(0,0,0,0.48)';

export const lightColors: ColorTokens = {
    bg: {
        page: '#f6f7fb',
        surface: '#ffffff',
        raised: '#f1f4f8',
    },
    text: {
        primary: '#172033',
        secondary: '#667085',
        muted: '#6f7887',
    },
    border: {
        default: '#dde3ec',
        strong: '#b7c0d1',
    },
    status: {
        neutral: { bg: '#eef0f4', fg: '#4b5568' },
        info: { bg: '#e7edfc', fg: '#3d63ad' },
        warning: { bg: '#fdf1de', fg: '#9a5109' },
        success: { bg: '#e7f6ec', fg: '#2f7a52' },
        danger: { bg: '#fbe9e9', fg: '#ad3632' },
    },
    accent: {
        bg: '#5264c8',
        fg: '#ffffff',
    },
};

export const darkColors: ColorTokens = {
    bg: {
        page: '#10131a',
        surface: '#181d27',
        raised: '#212838',
    },
    text: {
        primary: '#f5f7fb',
        secondary: '#a7b0c0',
        muted: '#7b8697',
    },
    border: {
        default: '#303849',
        strong: '#4a5568',
    },
    status: {
        neutral: { bg: '#232a38', fg: '#b7c0d1' },
        info: { bg: '#1c2740', fg: '#8fb3ff' },
        warning: { bg: '#2f2417', fg: '#e0aa54' },
        success: { bg: '#17291f', fg: '#7dd1a1' },
        danger: { bg: '#34201f', fg: '#e28383' },
    },
    accent: {
        bg: '#96a1ff',
        fg: '#161b2e',
    },
};
