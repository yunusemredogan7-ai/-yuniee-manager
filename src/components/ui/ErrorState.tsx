import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import PremiumCard from './PremiumCard';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { SPACING } from '../../core/theme/tokens';

type ErrorStateProps = {
    title: string;
    description: string;
    retryLabel?: string;
    onRetry?: () => void;
    style?: StyleProp<ViewStyle>;
};

export default function ErrorState({ title, description, retryLabel, onRetry, style }: ErrorStateProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <PremiumCard accentColor={colors.status.danger.fg} style={[styles.card, style]}>
            <Text style={[v.type.title, styles.icon, { color: colors.status.danger.fg }]}>!</Text>
            <Text style={[v.type.heading, styles.title, { color: colors.text.primary }]}>{title}</Text>
            <Text style={[v.type.body, styles.desc, { color: colors.text.secondary }]}>{description}</Text>
            {retryLabel && onRetry ? (
                <TouchableOpacity style={[v.secondaryButton, styles.retry]} onPress={onRetry}>
                    <Text style={[v.type.label, { color: colors.text.primary }]}>{retryLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </PremiumCard>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
    },
    icon: {
        marginBottom: SPACING.sm,
    },
    title: {
        marginBottom: SPACING.xs,
    },
    desc: {
        textAlign: 'center',
    },
    retry: {
        marginTop: SPACING.lg,
    },
});
