import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FinanceOverview from './FinanceOverview';
import SalesHistory from './SalesHistory';
import Expenses from './Expenses';
import PackagingMaterials from './PackagingMaterials';
import ProductRecipes from './ProductRecipes';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import SettingsHeaderButton from '../src/components/SettingsHeaderButton';

const Stack = createNativeStackNavigator();

export default function FinanceNavigator() {
    const { colors, t, language } = useAppSettings();
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
            <Stack.Screen name="FinanceOverview" component={FinanceOverview} options={{ title: t('finance') }} />
            <Stack.Screen name="SalesHistory" component={SalesHistory} options={{ title: language === 'tr' ? 'Satış Geçmişi' : 'Sales History' }} />
            <Stack.Screen name="Expenses" component={Expenses} options={{ title: language === 'tr' ? 'Giderler' : 'Expenses' }} />
            <Stack.Screen name="PackagingMaterials" component={PackagingMaterials} options={{ title: language === 'tr' ? 'Paketleme Malzemeleri' : 'Packaging Materials' }} />
            <Stack.Screen name="ProductRecipes" component={ProductRecipes} options={{ title: language === 'tr' ? 'Ürün Reçeteleri' : 'Product Recipes' }} />
        </Stack.Navigator>
    );
}
