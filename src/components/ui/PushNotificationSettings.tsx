import React from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { notificationService } from '../../services/notificationService';
import { pushTokenService, PushPermissionState } from '../../services/pushTokenService';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import PremiumCard from './PremiumCard';
import QuickActionButton from './QuickActionButton';
import StatusBadge from './StatusBadge';
import WarningCard from './WarningCard';
import { RADIUS, SPACING } from '../../core/theme/tokens';

type PushNotificationSettingsProps = {
    title: string;
    description: string;
    enabledLabel: string;
    notConfiguredLabel: string;
    openSettingsLabel: string;
    eventsLabel: string;
    requestPermissionLabel: string;
    checkingLabel: string;
    tokenSavedLabel: string;
    permissionDeniedLabel: string;
    tokenUnavailableLabel: string;
};

export default function PushNotificationSettings({
    title,
    description,
    enabledLabel,
    notConfiguredLabel,
    openSettingsLabel,
    eventsLabel,
    requestPermissionLabel,
    checkingLabel,
    tokenSavedLabel,
    permissionDeniedLabel,
    tokenUnavailableLabel,
}: PushNotificationSettingsProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const readiness = notificationService.getPushReadiness();
    const [status, setStatus] = React.useState<PushPermissionState>('not_supported');
    const [message, setMessage] = React.useState(readiness.reason);
    const [checking, setChecking] = React.useState(false);

    React.useEffect(() => {
        let alive = true;
        setChecking(true);
        pushTokenService.checkPermissionStatus().then(result => {
            if (!alive) return;
            setStatus(result.state);
            setMessage(result.message || readiness.reason);
            setChecking(false);
        });
        return () => { alive = false; };
    }, [readiness.reason]);

    async function requestPermission() {
        setChecking(true);
        const result = await pushTokenService.requestPermissionAndRegisterToken();
        setStatus(result.state);
        setMessage(result.message || readiness.reason);
        setChecking(false);
    }

    const statusLabel =
        checking ? checkingLabel :
        status === 'token_saved' ? tokenSavedLabel :
        status === 'permission_granted' ? enabledLabel :
        status === 'permission_denied' ? permissionDeniedLabel :
        status === 'token_unavailable' ? tokenUnavailableLabel :
        notConfiguredLabel;
    const statusTone =
        status === 'token_saved' || status === 'permission_granted' ? 'success' :
        status === 'permission_denied' || status === 'error' ? 'danger' :
        'warning';

    return (
        <PremiumCard style={styles.card}>
            <View style={styles.header}>
                <Text style={[v.type.heading, styles.title, { color: colors.text.primary }]}>{title}</Text>
                <StatusBadge label={statusLabel} tone={statusTone} />
            </View>
            <Text style={[v.type.body, { color: colors.text.secondary }]}>{description}</Text>
            <WarningCard title={statusLabel} description={message} tone={statusTone === 'success' ? 'success' : statusTone === 'danger' ? 'danger' : 'warning'} style={styles.warning} />
            <Text style={[v.type.label, styles.eventsLabel, { color: colors.text.primary }]}>{eventsLabel}</Text>
            <View style={styles.eventList}>
                {['New orders', 'Ready to pack', 'Packing tasks', 'Low stock', 'Waiting tasks'].map(event => (
                    <View key={event} style={[styles.eventChip, { borderColor: colors.border.default, backgroundColor: colors.bg.raised, borderRadius: RADIUS.pill }]}>
                        <Text style={[v.type.label, { color: colors.text.primary }]}>{event}</Text>
                    </View>
                ))}
            </View>
            {Platform.OS === 'ios' ? (
                <View style={styles.actions}>
                    <QuickActionButton
                        label={requestPermissionLabel}
                        icon="+"
                        tone="primary"
                        onPress={requestPermission}
                        disabled={checking}
                        style={styles.actionButton}
                    />
                    <QuickActionButton
                        label={openSettingsLabel}
                        icon="→"
                        tone="neutral"
                        onPress={() => Linking.openSettings().catch(() => undefined)}
                        style={styles.actionButton}
                    />
                </View>
            ) : null}
        </PremiumCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    title: {
        flex: 1,
    },
    warning: {
        marginTop: SPACING.md,
    },
    eventsLabel: {
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    eventList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    eventChip: {
        borderWidth: 1,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    actionButton: {
        flex: 1,
    },
});
