import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../core/theme/tokens';

type EmptyStateProps = {
    icon: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: StyleProp<ViewStyle>;
};

export default function EmptyState({ icon, title, description, actionLabel, onAction, style }: EmptyStateProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View style={[v.cardCompact, styles.wrap, style]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.bg.raised, borderColor: colors.border.default }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[v.type.heading, styles.title, { color: colors.text.primary }]}>{title}</Text>
            {description ? <Text style={[v.type.body, styles.desc, { color: colors.text.secondary }]}>{description}</Text> : null}
            {actionLabel && onAction ? (
                <TouchableOpacity style={[v.primaryButton, styles.action]} onPress={onAction} activeOpacity={0.82}>
                    <Text style={[v.type.label, { color: colors.accent.fg }]}>{actionLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    icon: {
        fontSize: TYPOGRAPHY.title.fontSize,
    },
    title: {
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    desc: {
        textAlign: 'center',
        maxWidth: 260,
    },
    action: {
        marginTop: SPACING.lg,
    },
});
