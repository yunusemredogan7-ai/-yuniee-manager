import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING } from '../../core/theme/tokens';

type OrderFlowStepperProps = {
    status: string;
    labels?: {
        new: string;
        production: string;
        ready: string;
        packed: string;
        delivered: string;
        cancelled: string;
    };
};

const DEFAULT_LABELS = {
    new: 'New',
    production: 'In production',
    ready: 'Ready to pack',
    packed: 'Packed',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

function getStepIndex(status: string): number {
    switch (status) {
        case 'Preparing': return 1;
        case 'Ready': return 2;
        case 'Shipped': return 3;
        case 'Delivered': return 4;
        case 'Cancelled': return -1;
        default: return 0;
    }
}

export default function OrderFlowStepper({ status, labels = DEFAULT_LABELS }: OrderFlowStepperProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const activeIndex = getStepIndex(status);
    const isCancelled = status === 'Cancelled';
    const steps = [
        labels.new,
        labels.production,
        labels.ready,
        labels.packed,
        labels.delivered,
    ];

    if (isCancelled) {
        return (
            <View style={[styles.cancelled, v.dangerSurface, { borderRadius: RADIUS.md }]}>
                <Text style={[v.type.label, { color: colors.status.danger.fg }]}>{labels.cancelled}</Text>
            </View>
        );
    }

    return (
        <View style={styles.wrap}>
            {steps.map((step, index) => {
                const complete = index <= activeIndex;
                return (
                    <View key={step} style={styles.step}>
                        <View style={[styles.dot, { backgroundColor: complete ? colors.accent.bg : colors.bg.raised, borderColor: complete ? colors.accent.bg : colors.border.default }]} />
                        <Text style={[v.type.caption, styles.label, { color: complete ? colors.text.primary : colors.text.secondary }]} numberOfLines={1}>
                            {step}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
    },
    step: {
        flex: 1,
        alignItems: 'center',
        gap: SPACING.xs,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
    },
    label: {
        fontWeight: '600',
        textAlign: 'center',
    },
    cancelled: {
        borderWidth: 1,
        padding: SPACING.sm,
        marginTop: SPACING.sm,
        alignItems: 'center',
    },
});
