import type { TextStyle } from 'react-native';

type TypeStyle = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const typography = {
    displayLg: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },
    display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
    h1: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.2 },
    h2: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.1 },
    h3: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
    body: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
    metric: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.4 },
    metricSm: { fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.2 },
} satisfies Record<string, TypeStyle>;

export type TypographyKey = keyof typeof typography;
