import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { spacing } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

type SectionProps = {
    title?: string;
    subtitle?: string;
    overline?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    style?: ViewStyle;
    headerStyle?: ViewStyle;
};

export function Section({
    title,
    subtitle,
    overline,
    action,
    children,
    style,
    headerStyle,
}: SectionProps) {
    const { colors } = useAppSettings();
    const hasHeader = title || subtitle || overline || action;

    return (
        <View style={[styles.wrap, style]}>
            {hasHeader ? (
                <View style={[styles.header, headerStyle]}>
                    <View style={{ flex: 1 }}>
                        {overline ? (
                            <Text
                                style={[
                                    typography.overline,
                                    { color: colors.textMuted, textTransform: 'uppercase' },
                                ]}
                            >
                                {overline}
                            </Text>
                        ) : null}
                        {title ? (
                            <Text style={[typography.h1, { color: colors.text }]}>{title}</Text>
                        ) : null}
                        {subtitle ? (
                            <Text style={[typography.body, { color: colors.subtext, marginTop: 2 }]}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                    {action ? <View>{action}</View> : null}
                </View>
            ) : null}
            <View style={{ gap: spacing.md }}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
});
