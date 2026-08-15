import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, StatusTone, TOUCH } from '../../core/theme/tokens';

type QuickActionButtonProps = {
    label: string;
    onPress: () => void;
    icon?: string;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
};

// 'primary' isn't a status — it fills solid with the brand accent, same as
// a primary button. 'success'/'warning'/'danger' are genuine status meaning
// and use that status's tint background + `.fg`, same as StatusBadge.
// 'neutral' is a plain outlined button.
const TONE_STATUS: Partial<Record<QuickActionButtonProps['tone'] & string, StatusTone>> = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
};

export default function QuickActionButton({ label, onPress, icon = '+', tone = 'primary', style, disabled }: QuickActionButtonProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const statusTone = TONE_STATUS[tone];
    const isNeutral = tone === 'neutral';
    const bg = isNeutral ? colors.bg.raised : statusTone ? colors.status[statusTone].bg : colors.accent.bg;
    const border = isNeutral ? colors.border.default : statusTone ? colors.status[statusTone].fg : colors.accent.bg;
    const fg = isNeutral ? colors.text.primary : statusTone ? colors.status[statusTone].fg : colors.accent.fg;
    const dynamicStyles = React.useMemo(() => StyleSheet.create({
        textColor: { color: fg },
    }), [fg]);

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    borderRadius: RADIUS.md,
                    borderColor: border,
                    backgroundColor: bg,
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.82}
        >
            <Text style={[v.type.label, styles.icon, dynamicStyles.textColor]}>{icon}</Text>
            <Text style={[v.type.label, dynamicStyles.textColor]} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: TOUCH.minSize,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderWidth: 1,
    },
    icon: {
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.55,
    },
});
