import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Stock from './Stock';
import ProductManagement from './ProductManagement';
import StockMovements from './StockMovements';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import SettingsHeaderButton from '../src/components/SettingsHeaderButton';

const Stack = createNativeStackNavigator();

export default function StockNavigator() {
    const { colors, language, t } = useAppSettings();
    const screenOptions = {
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' as const },
    };

    return (
        <Stack.Navigator screenOptions={{
            ...screenOptions,
            headerRight: SettingsHeaderButton,
        }}>
            <Stack.Screen name="StockOverview" component={Stock} options={{ title: t('stock') }} />
            <Stack.Screen name="ProductManagement" component={ProductManagement} options={{ title: language === 'tr' ? 'Ürün Yönetimi' : 'Product Management' }} />
            <Stack.Screen name="StockMovements" component={StockMovements} options={{ title: language === 'tr' ? 'Hareket Geçmişi' : 'Movements History' }} />
        </Stack.Navigator>
    );
}
