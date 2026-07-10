import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
    options: SegmentOption<T>[];
    value: T;
    onChange: (next: T) => void;
    style?: ViewStyle;
    size?: 'sm' | 'md';
};

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    style,
    size = 'md',
}: SegmentedControlProps<T>) {
    const { colors } = useAppSettings();
    const padV = size === 'sm' ? 6 : 8;

    return (
        <View
            style={[
                styles.wrap,
                { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
                style,
            ]}
        >
            {options.map(opt => {
                const active = opt.value === value;
                return (
                    <Pressable
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={[
                            styles.segment,
                            {
                                paddingVertical: padV,
                                backgroundColor: active ? colors.surfaceElevated : 'transparent',
                            },
                            active ? styles.segmentActive : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                    >
                        <Text
                            style={[
                                typography.caption,
                                {
                                    color: active ? colors.text : colors.subtext,
                                    fontSize: size === 'sm' ? 12 : 13,
                                },
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        borderRadius: radii.md,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 3,
        gap: 2,
    },
    segment: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
    },
    segmentActive: {
        shadowColor: '#0b1220',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
});
