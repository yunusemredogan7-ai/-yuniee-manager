import { AppColors } from '../settings/AppSettingsContext';
import { RADIUS, SHADOW_COLOR, SPACING, TYPOGRAPHY } from './tokens';

/** Re-exported for call sites that used `spacing`/`radius`/`type` from this
 * module directly — the values themselves live in `./tokens`. */
export const spacing = SPACING;
export const radius = RADIUS;
export const type = TYPOGRAPHY;

export function createVisualSystem(colors: AppColors, themeMode: 'light' | 'dark') {
    const isDark = themeMode === 'dark';
    const softShadow = {
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: isDark ? 2 : 3 },
        shadowOpacity: isDark ? 0.14 : 0.06,
        shadowRadius: isDark ? 8 : 12,
        elevation: isDark ? 1 : 3,
    };

    return {
        spacing: SPACING,
        radius: RADIUS,
        type: TYPOGRAPHY,
        hairline: {
            borderWidth: 1,
            borderColor: colors.border.default,
        },
        card: {
            backgroundColor: colors.bg.surface,
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            borderWidth: 1,
            borderColor: colors.border.default,
            ...softShadow,
        },
        cardCompact: {
            backgroundColor: colors.bg.surface,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            borderWidth: 1,
            borderColor: colors.border.default,
            ...softShadow,
        },
        input: {
            minHeight: 46,
            borderWidth: 1,
            borderColor: colors.border.default,
            backgroundColor: colors.bg.raised,
            borderRadius: RADIUS.sm,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.md - 1,
            fontSize: TYPOGRAPHY.body.fontSize,
            color: colors.text.primary,
        },
        primaryButton: {
            minHeight: 46,
            backgroundColor: colors.accent.bg,
            borderRadius: RADIUS.sm,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            shadowColor: colors.accent.bg,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.22 : 0.16,
            shadowRadius: 8,
            elevation: 3,
        },
        secondaryButton: {
            minHeight: 44,
            backgroundColor: colors.bg.raised,
            borderRadius: RADIUS.sm,
            borderWidth: 1,
            borderColor: colors.border.default,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
        },
        chip: {
            borderRadius: RADIUS.pill,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs + 1,
            borderWidth: 1,
            borderColor: colors.border.default,
            backgroundColor: colors.bg.raised,
        },
        // Tinted callout/highlight surfaces, one per status tone. Background
        // is the status's `.bg`; the border reuses its `.fg` so the whole
        // surface stays within that status's two defined shades.
        neutralSurface: { backgroundColor: colors.status.neutral.bg, borderColor: colors.status.neutral.fg },
        infoSurface: { backgroundColor: colors.status.info.bg, borderColor: colors.status.info.fg },
        warningSurface: { backgroundColor: colors.status.warning.bg, borderColor: colors.status.warning.fg },
        successSurface: { backgroundColor: colors.status.success.bg, borderColor: colors.status.success.fg },
        dangerSurface: { backgroundColor: colors.status.danger.bg, borderColor: colors.status.danger.fg },
    };
}
