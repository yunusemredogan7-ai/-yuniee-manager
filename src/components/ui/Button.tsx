import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    type GestureResponderEvent,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing, motion, elevation } from '../../core/design/tokens';
import { typography } from '../../core/design/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
    label: string;
    onPress?: (e: GestureResponderEvent) => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    testID?: string;
};

export function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    style,
    textStyle,
    testID,
}: ButtonProps) {
    const { colors, themeMode } = useAppSettings();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.timing(scale, {
            toValue: 0.97,
            duration: motion.fast,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration: motion.base,
            useNativeDriver: true,
        }).start();
    };

    const palette = (() => {
        switch (variant) {
            case 'primary':
                return { bg: colors.primary, fg: colors.textInverse, border: 'transparent' };
            case 'secondary':
                return { bg: colors.primarySoft, fg: colors.primary, border: 'transparent' };
            case 'ghost':
                return { bg: 'transparent', fg: colors.text, border: colors.border };
            case 'danger':
                return { bg: colors.danger, fg: colors.textInverse, border: 'transparent' };
        }
    })();

    const sizing = (() => {
        switch (size) {
            case 'sm':
                return { paddingV: 8, paddingH: 14, fontSize: 13, iconGap: 6, minHeight: 36 };
            case 'md':
                return { paddingV: 12, paddingH: 18, fontSize: 14, iconGap: 8, minHeight: 44 };
            case 'lg':
                return { paddingV: 15, paddingH: 22, fontSize: 16, iconGap: 10, minHeight: 52 };
        }
    })();

    const elev = variant === 'primary' || variant === 'danger'
        ? elevation('sm', themeMode)
        : elevation('none', themeMode);

    return (
        <Animated.View
            style={[
                { transform: [{ scale }], opacity: disabled || loading ? 0.55 : 1 },
                fullWidth ? styles.fullWidth : null,
                style,
            ]}
        >
            <Pressable
                onPress={disabled || loading ? undefined : onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityRole="button"
                accessibilityState={{ disabled: disabled || loading }}
                testID={testID}
                style={[
                    styles.base,
                    {
                        backgroundColor: palette.bg,
                        borderColor: palette.border,
                        paddingVertical: sizing.paddingV,
                        paddingHorizontal: sizing.paddingH,
                        minHeight: sizing.minHeight,
                    },
                    elev,
                ]}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={palette.fg} />
                ) : (
                    <View style={[styles.row, { gap: sizing.iconGap }]}>
                        {leftIcon ? <View>{leftIcon}</View> : null}
                        <Text
                            style={[
                                typography.bodyStrong as TextStyle,
                                { color: palette.fg, fontSize: sizing.fontSize },
                                textStyle,
                            ]}
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                        {rightIcon ? <View>{rightIcon}</View> : null}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radii.md,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fullWidth: {
        alignSelf: 'stretch',
    },
});
