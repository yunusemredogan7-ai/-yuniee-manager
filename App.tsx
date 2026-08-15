import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from './src/core/supabase/client';
import { Session } from '@supabase/supabase-js';
import Icon from 'react-native-vector-icons/Ionicons';

import Login from './screens/Login';

import DashboardNavigator from "./screens/DashboardNavigator";
import Orders from "./screens/Orders";
import StockNavigator from "./screens/StockNavigator";
import FinanceNavigator from "./screens/FinanceNavigator";
import ToDo from "./screens/ToDo";
import { AppSettingsProvider, useAppSettings } from './src/core/settings/AppSettingsContext';
import { SHADOW_COLOR, SPACING, TYPOGRAPHY } from './src/core/theme/tokens';

const Tab = createBottomTabNavigator();

// Keyed by tab route name — "Dashboard" and "Tasks" are route names, not the
// labels shown under the icon (those come from each Tab.Screen's options).
const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  Orders: { focused: 'receipt', unfocused: 'receipt-outline' },
  Stock: { focused: 'cube', unfocused: 'cube-outline' },
  Finance: { focused: 'wallet', unfocused: 'wallet-outline' },
  Tasks: { focused: 'checkbox', unfocused: 'checkbox-outline' },
};

function renderTabIcon(routeName: string, focused: boolean, color: string, size: number) {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Dashboard;
  const iconName = focused ? icons.focused : icons.unfocused;
  return <Icon name={iconName} size={size} color={color} />;
}

function TabNavigator() {
  const { colors, t } = useAppSettings();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg.surface },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { ...TYPOGRAPHY.heading },
        tabBarIcon: ({ focused, color, size }) =>
          renderTabIcon(route.name, focused, color, size),
        tabBarShowLabel: true,
        // Active reads as the strongest text color, inactive as the muted
        // one — no accent fill on the tab bar itself.
        tabBarActiveTintColor: colors.text.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
        },
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.default,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: SHADOW_COLOR,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          // react-navigation's bottom-tabs already pads for the home
          // indicator via safe-area insets on iOS; these are on top of
          // that inset, not instead of it.
          height: 88,
          paddingBottom: SPACING.xxl,
          paddingTop: SPACING.sm,
        },
      })}
    >
      {/* Each tab that owns child screens (Dashboard→Settings,
          Stock→Products/Movements/Materials/Recipes, Finance→Sales/Expenses)
          is a nested stack, not a bare screen — this is what makes
          `navigation.navigate('Stock', { screen: 'ProductManagement' })`
          work as a deep link into a specific child from anywhere in the
          app. Orders and Tasks have no children today, so they stay bare;
          wrapping them in a one-screen stack later is a non-breaking change. */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{ headerShown: false, title: t('dashboard'), tabBarLabel: t('dashboard') }}
      />
      <Tab.Screen
        name="Orders"
        component={Orders}
        options={{ title: t('orders'), tabBarLabel: t('orders') }}
      />
      <Tab.Screen
        name="Stock"
        component={StockNavigator}
        options={{ headerShown: false, title: t('stock'), tabBarLabel: t('stock') }}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceNavigator}
        options={{ headerShown: false, title: t('finance'), tabBarLabel: t('finance') }}
      />
      <Tab.Screen
        name="Tasks"
        component={ToDo}
        options={{ title: t('todo'), tabBarLabel: t('todo') }}
      />
    </Tab.Navigator>
  );
}

function AppShell() {
  const [session, setSession] = React.useState<Session | null>(null);
  const { themeMode, colors } = useAppSettings();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!session) {
    return <Login />;
  }

  const navigationTheme = {
    ...(themeMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg.page,
      card: colors.bg.surface,
      text: colors.text.primary,
      border: colors.border.default,
      primary: colors.accent.bg,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <TabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // Required for the bottom tab bar (and anything else using
    // useSafeAreaInsets) to read the device's real safe-area insets —
    // without this, the home-indicator inset on notched iPhones isn't
    // measured and the tab bar can't reliably respect it.
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppShell />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
