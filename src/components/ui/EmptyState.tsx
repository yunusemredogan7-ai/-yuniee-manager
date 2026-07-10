import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

type EmptyStateProps = {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    style?: ViewStyle;
};

export function EmptyState({ icon = 'sparkles-outline', title, description, action, style }: EmptyStateProps) {
    const { colors } = useAppSettings();

    return (
        <View style={[styles.wrap, style]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft }]}>
                <Icon name={icon} size={26} color={colors.primary} />
            </View>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.md }]}>
                {title}
            </Text>
            {description ? (
                <Text
                    style={[
                        typography.body,
                        { color: colors.subtext, textAlign: 'center', marginTop: 4, maxWidth: 280 },
                    ]}
                >
                    {description}
                </Text>
            ) : null}
            {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    iconBubble: {
        width: 56,
        height: 56,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
