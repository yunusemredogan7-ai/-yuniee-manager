import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type BadgeProps = {
    label: string;
    tone?: BadgeTone;
    dot?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
};

export function Badge({ label, tone = 'neutral', dot = false, icon, style }: BadgeProps) {
    const { colors } = useAppSettings();

    const palette = (() => {
        switch (tone) {
            case 'primary':
                return { bg: colors.primarySoft, fg: colors.primary };
            case 'success':
                return { bg: colors.successSoft, fg: colors.success };
            case 'warning':
                return { bg: colors.warningSoft, fg: colors.warning };
            case 'danger':
                return { bg: colors.dangerSoft, fg: colors.danger };
            case 'neutral':
            default:
                return { bg: colors.surfaceMuted, fg: colors.subtext };
        }
    })();

    return (
        <View style={[styles.wrap, { backgroundColor: palette.bg }, style]}>
            {dot ? <View style={[styles.dot, { backgroundColor: palette.fg }]} /> : null}
            {icon ? <View>{icon}</View> : null}
            <Text style={[typography.caption, { color: palette.fg }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: spacing.sm + 2,
        borderRadius: radii.pill,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
