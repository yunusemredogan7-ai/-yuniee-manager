import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, StatusTone } from '../../core/theme/tokens';

type BadgeTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

type StatusBadgeProps = {
    label: string;
    tone?: BadgeTone;
    dot?: boolean;
    style?: StyleProp<ViewStyle>;
};

// 'default'/'muted' both read as the neutral status tone, 'primary' as info.
const TONE_STATUS: Record<BadgeTone, StatusTone> = {
    default: 'neutral',
    muted: 'neutral',
    primary: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
};

export default function StatusBadge({ label, tone = 'default', dot, style }: StatusBadgeProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const statusTone = TONE_STATUS[tone];
    const toneColor = colors.status[statusTone].fg;
    const surface =
        statusTone === 'success' ? v.successSurface :
        statusTone === 'warning' ? v.warningSurface :
        statusTone === 'danger' ? v.dangerSurface :
        statusTone === 'info' ? v.infoSurface :
        v.neutralSurface;

    return (
        <View style={[styles.badge, surface, style]}>
            {dot ? <View style={[styles.dot, { backgroundColor: toneColor }]} /> : null}
            <Text style={[v.type.caption, styles.text, { color: toneColor }]} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: SPACING.xs,
        borderWidth: 1,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: RADIUS.pill,
    },
    text: {
        fontWeight: '600',
    },
});
