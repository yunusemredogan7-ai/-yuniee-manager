import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSettings } from '../core/settings/AppSettingsContext';

export default function SettingsHeaderButton({ tintColor }: { tintColor?: string }) {
    const navigation = useNavigation<any>();
    const { colors } = useAppSettings();

    function openSettings() {
        const tabParent = navigation.getParent?.();
        const rootParent = tabParent?.getParent?.();
        if (rootParent?.navigate) rootParent.navigate('Settings');
        else if (tabParent?.navigate) tabParent.navigate('Settings');
        else navigation.navigate('Settings');
    }

    return (
        <TouchableOpacity
            onPress={openSettings}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Settings"
        >
            <Icon name="settings-outline" size={22} color={tintColor || colors.text} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
