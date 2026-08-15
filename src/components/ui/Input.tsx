import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    helper?: string;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    containerStyle?: ViewStyle;
};

export function Input({
    label,
    error,
    helper,
    leftAddon,
    rightAddon,
    containerStyle,
    onFocus,
    onBlur,
    style,
    ...rest
}: InputProps) {
    const { colors } = useAppSettings();
    const [focused, setFocused] = useState(false);

    const borderColor = error
        ? colors.danger
        : focused
            ? colors.primary
            : colors.border;

    return (
        <View style={containerStyle}>
            {label ? (
                <Text style={[typography.caption, { color: colors.subtext, marginBottom: spacing.xs }]}>
                    {label}
                </Text>
            ) : null}
            <View
                style={[
                    styles.wrap,
                    {
                        backgroundColor: colors.surfaceSunken,
                        borderColor,
                    },
                ]}
            >
                {leftAddon ? <View style={styles.addon}>{leftAddon}</View> : null}
                <TextInput
                    placeholderTextColor={colors.textMuted}
                    {...rest}
                    onFocus={e => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={e => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    style={[
                        styles.input,
                        { color: colors.text },
                        typography.body,
                        style,
                    ]}
                />
                {rightAddon ? <View style={styles.addon}>{rightAddon}</View> : null}
            </View>
            {error ? (
                <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
                    {error}
                </Text>
            ) : helper ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
                    {helper}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radii.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.md,
        minHeight: 46,
    },
    focused: {
        shadowOpacity: 0.5,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
    },
    addon: {
        paddingHorizontal: spacing.xs,
    },
});
