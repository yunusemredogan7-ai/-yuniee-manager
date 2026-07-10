import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSettings } from '../core/settings/AppSettingsContext';
import { radii, motion } from '../core/design/tokens';

export default function SettingsHeaderButton({ tintColor }: { tintColor?: string }) {
    const navigation = useNavigation<any>();
    const { colors } = useAppSettings();
    const scale = useRef(new Animated.Value(1)).current;

    function openSettings() {
        const tabParent = navigation.getParent?.();
        const rootParent = tabParent?.getParent?.();
        if (rootParent?.navigate) rootParent.navigate('Settings');
        else if (tabParent?.navigate) tabParent.navigate('Settings');
        else navigation.navigate('Settings');
    }

    return (
        <Animated.View style={{ transform: [{ scale }], marginRight: 12 }}>
            <Pressable
                onPress={openSettings}
                onPressIn={() => {
                    Animated.timing(scale, {
                        toValue: 0.92,
                        duration: motion.fast,
                        useNativeDriver: true,
                    }).start();
                }}
                onPressOut={() => {
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: motion.base,
                        useNativeDriver: true,
                    }).start();
                }}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={[
                    styles.button,
                    {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Icon name="settings-outline" size={18} color={tintColor || colors.text} />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 36,
        height: 36,
        borderRadius: radii.pill,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
