import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppNotification } from '../../core/notifications/notificationTypes';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import PremiumCard from './PremiumCard';
import SectionHeader from './SectionHeader';
import StatusBadge from './StatusBadge';
import { RADIUS, SPACING } from '../../core/theme/tokens';

type NotificationCenterProps = {
    title: string;
    emptyText: string;
    notifications: AppNotification[];
    onPressItem?: (item: AppNotification) => void;
    limit?: number;
};

function toneFor(severity: AppNotification['severity']) {
    if (severity === 'danger') return 'danger';
    if (severity === 'warning') return 'warning';
    if (severity === 'success') return 'success';
    return 'primary';
}

export default function NotificationCenter({ title, emptyText, notifications, onPressItem, limit = 6 }: NotificationCenterProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const visible = notifications.slice(0, limit);

    return (
        <PremiumCard style={styles.card}>
            <SectionHeader title={title} right={<StatusBadge label={String(notifications.length)} tone={notifications.length ? 'warning' : 'success'} />} />
            {visible.length === 0 ? (
                <Text style={[v.type.label, { color: colors.text.secondary }]}>{emptyText}</Text>
            ) : visible.map(item => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.item, { borderColor: colors.border.default, borderRadius: RADIUS.md, backgroundColor: colors.bg.raised }]}
                    onPress={() => onPressItem?.(item)}
                    activeOpacity={0.82}
                >
                    <View style={styles.itemText}>
                        <Text style={[v.type.label, styles.itemTitle, { color: colors.text.primary }]}>{item.title}</Text>
                        {item.message ? <Text style={[v.type.caption, styles.itemMessage, { color: colors.text.secondary }]}>{item.message}</Text> : null}
                    </View>
                    <StatusBadge label={item.category} tone={toneFor(item.severity)} />
                </TouchableOpacity>
            ))}
        </PremiumCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: SPACING.xl,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    itemText: {
        flex: 1,
    },
    itemTitle: {
        fontWeight: '700',
    },
    itemMessage: {
        marginTop: SPACING.xs,
    },
});
