import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    type GestureResponderEvent,
    type ViewStyle,
} from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing, motion, elevation, type Elevation } from '../../core/design/tokens';

type PressableCardProps = {
    onPress?: (e: GestureResponderEvent) => void;
    children: React.ReactNode;
    elevated?: Elevation;
    padding?: keyof typeof spacing | number;
    style?: ViewStyle;
    disabled?: boolean;
};

export function PressableCard({
    onPress,
    children,
    elevated = 'sm',
    padding = 'lg',
    style,
    disabled,
}: PressableCardProps) {
    const { colors, themeMode } = useAppSettings();
    const scale = useRef(new Animated.Value(1)).current;
    const padValue = typeof padding === 'number' ? padding : spacing[padding];

    const handlePressIn = () => {
        Animated.timing(scale, {
            toValue: 0.985,
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

    return (
        <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? 0.55 : 1 }]}>
            <Pressable
                onPress={disabled ? undefined : onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.base,
                    {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        padding: padValue,
                    },
                    elevation(elevated, themeMode),
                    style,
                ]}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radii.lg,
        borderWidth: StyleSheet.hairlineWidth,
    },
});
