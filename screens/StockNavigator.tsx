import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Stock from './Stock';
import ProductManagement from './ProductManagement';
import StockMovements from './StockMovements';
import PackagingMaterials from './PackagingMaterials';
import ProductRecipes from './ProductRecipes';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { TYPOGRAPHY } from '../src/core/theme/tokens';

const Stack = createNativeStackNavigator();

export default function StockNavigator() {
    const { colors, language, t } = useAppSettings();
    const screenOptions = {
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { ...TYPOGRAPHY.heading },
    };

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="StockOverview" component={Stock} options={{ title: t('stock') }} />
            <Stack.Screen name="ProductManagement" component={ProductManagement} options={{ title: language === 'tr' ? 'Ürün Yönetimi' : 'Product Management' }} />
            <Stack.Screen name="StockMovements" component={StockMovements} options={{ title: language === 'tr' ? 'Hareket Geçmişi' : 'Movements History' }} />
            {/* Packaging Materials / Recipes live under Stock, entered from the
                Stock overview screen's nav section (see screens/Stock.tsx) —
                see the navigation-restructure notes for why Stock rather than
                Products. */}
            <Stack.Screen name="PackagingMaterials" component={PackagingMaterials} options={{ title: language === 'tr' ? 'Paketleme Malzemeleri' : 'Packaging Materials' }} />
            <Stack.Screen name="ProductRecipes" component={ProductRecipes} options={{ title: language === 'tr' ? 'Ürün Reçeteleri' : 'Product Recipes' }} />
        </Stack.Navigator>
    );
}
