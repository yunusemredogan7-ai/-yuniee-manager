import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FinanceOverview from './FinanceOverview';
import SalesHistory from './SalesHistory';
import Expenses from './Expenses';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { TYPOGRAPHY } from '../src/core/theme/tokens';

const Stack = createNativeStackNavigator();

export default function FinanceNavigator() {
    const { colors, t, language } = useAppSettings();
    const screenOptions = {
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { ...TYPOGRAPHY.heading },
    };

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="FinanceOverview" component={FinanceOverview} options={{ title: t('finance') }} />
            <Stack.Screen name="SalesHistory" component={SalesHistory} options={{ title: language === 'tr' ? 'Satış Geçmişi' : 'Sales History' }} />
            <Stack.Screen name="Expenses" component={Expenses} options={{ title: language === 'tr' ? 'Giderler' : 'Expenses' }} />
        </Stack.Navigator>
    );
}
