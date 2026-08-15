import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING } from '../../core/theme/tokens';

type LoadingSkeletonProps = {
    rows?: number;
    variant?: 'card' | 'metric';
    style?: StyleProp<ViewStyle>;
};

export default function LoadingSkeleton({ rows = 3, variant = 'card', style }: LoadingSkeletonProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View style={style}>
            {Array.from({ length: rows }).map((_, idx) => (
                <View key={idx} style={[variant === 'metric' ? v.card : v.cardCompact, styles.card]}>
                    <View style={[styles.line, styles.short, { backgroundColor: colors.bg.raised }]} />
                    <View style={[styles.line, styles.long, { backgroundColor: colors.bg.raised }]} />
                    <View style={[styles.line, styles.mid, { backgroundColor: colors.bg.raised }]} />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.sm,
        overflow: 'hidden',
    },
    line: {
        height: 10,
        borderRadius: RADIUS.pill,
        marginBottom: SPACING.sm,
        opacity: 0.9,
    },
    short: {
        width: '34%',
    },
    long: {
        width: '78%',
    },
    mid: {
        width: '52%',
        marginBottom: 0,
    },
});
