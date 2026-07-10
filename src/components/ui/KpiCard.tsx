import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing, elevation } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

export type KpiTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type KpiCardProps = {
    label: string;
    value: string;
    delta?: string;
    deltaDirection?: 'up' | 'down' | 'flat';
    icon?: string;
    tone?: KpiTone;
    loading?: boolean;
    style?: ViewStyle;
};

export function KpiCard({
    label,
    value,
    delta,
    deltaDirection = 'flat',
    icon,
    tone = 'primary',
    loading = false,
    style,
}: KpiCardProps) {
    const { colors, themeMode } = useAppSettings();

    const accent = (() => {
        switch (tone) {
            case 'primary':
                return { soft: colors.primarySoft, fg: colors.primary };
            case 'success':
                return { soft: colors.successSoft, fg: colors.success };
            case 'warning':
                return { soft: colors.warningSoft, fg: colors.warning };
            case 'danger':
                return { soft: colors.dangerSoft, fg: colors.danger };
            case 'neutral':
            default:
                return { soft: colors.surfaceMuted, fg: colors.subtext };
        }
    })();

    const deltaColor =
        deltaDirection === 'up'
            ? colors.success
            : deltaDirection === 'down'
                ? colors.danger
                : colors.subtext;
    const deltaIcon = deltaDirection === 'up' ? 'trending-up' : deltaDirection === 'down' ? 'trending-down' : 'remove';

    return (
        <View
            style={[
                styles.wrap,
                {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                },
                elevation('sm', themeMode),
                style,
            ]}
        >
            <View style={styles.header}>
                <Text style={[typography.caption, { color: colors.subtext, textTransform: 'uppercase' }]}>
                    {label}
                </Text>
                {icon ? (
                    <View style={[styles.iconWrap, { backgroundColor: accent.soft }]}>
                        <Icon name={icon} size={14} color={accent.fg} />
                    </View>
                ) : null}
            </View>
            <Text
                style={[typography.metric, { color: colors.text, marginTop: spacing.sm, opacity: loading ? 0.4 : 1 }]}
                numberOfLines={1}
            >
                {value}
            </Text>
            {delta ? (
                <View style={styles.deltaRow}>
                    <Icon name={deltaIcon} size={12} color={deltaColor} />
                    <Text style={[typography.caption, { color: deltaColor }]}>{delta}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
        padding: spacing.lg,
        minHeight: 110,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 26,
        height: 26,
        borderRadius: radii.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deltaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.xs,
    },
});
