import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../core/theme/tokens';

type SyncStatusProps = {
    timestamp?: Date | null;
    syncing?: boolean;
    label?: string;
    syncingLabel?: string;
    style?: StyleProp<ViewStyle>;
};

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SyncStatus({ timestamp, syncing, label = 'Synced', syncingLabel = 'Refreshing...', style }: SyncStatusProps) {
    const { colors } = useAppSettings();
    const text = syncing
        ? syncingLabel
        : timestamp
            ? `${label} ${formatTime(timestamp)}`
            : label;

    return (
        <View style={[styles.wrap, style]}>
            <View style={[styles.dot, { backgroundColor: syncing ? colors.status.warning.fg : colors.status.success.fg }]} />
            <Text style={[styles.text, { color: colors.text.secondary }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: RADIUS.pill,
    },
    text: {
        ...TYPOGRAPHY.caption,
    },
});
