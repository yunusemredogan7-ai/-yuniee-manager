import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppSettings } from '../core/settings/AppSettingsContext';
import { RADIUS, hitSlopFor } from '../core/theme/tokens';

const BUTTON_SIZE = 34;

export default function SettingsHeaderButton({ tintColor }: { tintColor?: string }) {
    const navigation = useNavigation<any>();
    const { colors } = useAppSettings();

    // Settings is only ever reached from Dashboard, where it's a direct
    // sibling in DashboardNavigator's own stack — no parent traversal needed.
    function openSettings() {
        navigation.navigate('Settings');
    }

    return (
        <TouchableOpacity
            onPress={openSettings}
            hitSlop={hitSlopFor(BUTTON_SIZE)}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Settings"
        >
            <Icon name="settings-outline" size={22} color={tintColor || colors.text.primary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: RADIUS.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
