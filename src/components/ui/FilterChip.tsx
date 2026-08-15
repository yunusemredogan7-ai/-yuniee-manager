import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, StatusTone, hitSlopFor } from '../../core/theme/tokens';

const CHIP_HEIGHT = 36;

type FilterChipProps = {
    label: string;
    selected?: boolean;
    onPress: () => void;
    count?: number;
    tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    style?: StyleProp<ViewStyle>;
};

// 'default' isn't a status — a plain chip selects into the brand accent.
// The other tones are genuine status meaning and select into a tinted
// status surface with that status's `.fg` for border/text, same as
// StatusBadge/WarningCard.
const TONE_STATUS: Partial<Record<Exclude<NonNullable<FilterChipProps['tone']>, 'default'>, StatusTone>> = {
    primary: 'info',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
};

export default function FilterChip({ label, selected, onPress, count, tone = 'default', style }: FilterChipProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const statusTone = tone === 'default' ? null : TONE_STATUS[tone] ?? null;
    const selectedBg = statusTone ? colors.status[statusTone].bg : colors.accent.bg;
    const selectedBorder = statusTone ? colors.status[statusTone].fg : colors.accent.bg;
    const selectedFg = statusTone ? colors.status[statusTone].fg : colors.accent.fg;
    const dynamicStyles = React.useMemo(() => StyleSheet.create({
        labelColor: { color: selected ? selectedFg : colors.text.primary },
        countColor: { color: selected ? selectedFg : colors.text.secondary },
    }), [colors.text.primary, colors.text.secondary, selected, selectedFg]);

    return (
        <TouchableOpacity
            style={[
                styles.chip,
                {
                    borderRadius: RADIUS.pill,
                    borderColor: selected ? selectedBorder : colors.border.default,
                    backgroundColor: selected ? selectedBg : colors.bg.raised,
                },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.82}
            hitSlop={hitSlopFor(CHIP_HEIGHT)}
        >
            <Text style={[v.type.label, styles.label, dynamicStyles.labelColor]} numberOfLines={1}>
                {label}
            </Text>
            {typeof count === 'number' ? (
                <Text style={[v.type.caption, dynamicStyles.countColor]}>
                    {count}
                </Text>
            ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        minHeight: CHIP_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
    },
    label: {
        fontWeight: '600',
    },
});
