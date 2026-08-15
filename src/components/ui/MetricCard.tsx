import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { SPACING } from '../../core/theme/tokens';

type MetricTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

type MetricCardProps = {
    label: string;
    value: string | number;
    tone?: MetricTone;
    helper?: string;
    style?: StyleProp<ViewStyle>;
};

// 'default'/'primary' both read as the neutral "info" status tone — this
// component only ever has one non-outcome-specific highlight color.
const TONE_STATUS = { default: 'info', primary: 'info', success: 'success', warning: 'warning', danger: 'danger' } as const;

export default function MetricCard({ label, value, tone = 'default', helper, style }: MetricCardProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const statusTone = TONE_STATUS[tone];
    const toneStyle =
        statusTone === 'success' ? v.successSurface :
        statusTone === 'warning' ? v.warningSurface :
        statusTone === 'danger' ? v.dangerSurface :
        v.infoSurface;
    const accent = colors.status[statusTone].fg;

    return (
        <View style={[v.card, toneStyle, styles.card, { borderLeftColor: accent }, style]}>
            <Text style={[v.type.label, styles.label, { color: colors.text.secondary }]}>{label}</Text>
            <Text style={[v.type.title, { color: tone === 'default' ? colors.text.primary : accent }]}>{value}</Text>
            {helper ? <Text style={[v.type.caption, styles.helper, { color: colors.text.secondary }]}>{helper}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderLeftWidth: 3,
    },
    label: {
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
    },
    helper: {
        marginTop: SPACING.xs,
    },
});
