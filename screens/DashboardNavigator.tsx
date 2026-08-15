import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './Dashboard';
import Settings from './Settings';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import SettingsHeaderButton from '../src/components/SettingsHeaderButton';
import { TYPOGRAPHY } from '../src/core/theme/tokens';

const Stack = createNativeStackNavigator();

export default function DashboardNavigator() {
    const { colors, t } = useAppSettings();
    const screenOptions = {
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { ...TYPOGRAPHY.heading },
    };

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            {/* The only screen with the Settings icon — Settings is reached
                from Dashboard and nowhere else. */}
            <Stack.Screen
                name="DashboardOverview"
                component={Dashboard}
                options={{ title: t('dashboard'), headerRight: SettingsHeaderButton }}
            />
            <Stack.Screen name="Settings" component={Settings} options={{ title: t('settings') }} />
        </Stack.Navigator>
    );
}
