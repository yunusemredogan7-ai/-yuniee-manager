export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
} as const;

export const radii = {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
} as const;

export const motion = {
    fast: 140,
    base: 220,
    slow: 320,
    easeOut: [0.16, 1, 0.3, 1] as const,
} as const;

export type Elevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export function elevation(level: Elevation, mode: 'light' | 'dark' = 'light') {
    if (level === 'none') {
        return { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 };
    }
    const isDark = mode === 'dark';
    const shadowColor = isDark ? '#000000' : '#0b1220';
    const map = {
        sm: { opacity: isDark ? 0.45 : 0.06, radius: 4, offsetY: 1, elev: 2 },
        md: { opacity: isDark ? 0.5 : 0.08, radius: 10, offsetY: 4, elev: 4 },
        lg: { opacity: isDark ? 0.55 : 0.12, radius: 18, offsetY: 8, elev: 8 },
        xl: { opacity: isDark ? 0.6 : 0.18, radius: 28, offsetY: 14, elev: 14 },
    }[level];
    return {
        shadowColor,
        shadowOpacity: map.opacity,
        shadowRadius: map.radius,
        shadowOffset: { width: 0, height: map.offsetY },
        elevation: map.elev,
    };
}
