import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, TOUCH } from '../../core/theme/tokens';

export type SegmentOption<T extends string> = {
    value: T;
    label: string;
};

type SegmentedControlProps<T extends string> = {
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View style={[styles.group, { backgroundColor: colors.bg.surface, borderColor: colors.border.default, borderRadius: RADIUS.md }]}>
            {options.map(option => {
                const selected = option.value === value;
                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.segment, { borderRadius: RADIUS.sm }, selected && { backgroundColor: colors.accent.bg }]}
                        onPress={() => onChange(option.value)}
                        activeOpacity={0.82}
                    >
                        <Text style={[v.type.label, styles.text, { color: colors.text.secondary }, selected && { color: colors.accent.fg }]} numberOfLines={1}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        flexDirection: 'row',
        gap: SPACING.xs,
        borderWidth: 1,
        padding: SPACING.xs,
    },
    segment: {
        flex: 1,
        // Row of adjacent segments: hitSlop between siblings would overlap,
        // so the touch target is met by sizing the control itself to 44
        // rather than padding hit-testing area outward.
        minHeight: TOUCH.minSize,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.sm,
    },
    text: {
        textAlign: 'center',
    },
});
