import React from "react";
import { NavigationContainer, CommonActions, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from './src/core/supabase/client';
import { Session } from '@supabase/supabase-js';
import Icon from 'react-native-vector-icons/Ionicons';

import Login from './screens/Login';

import Dashboard from "./screens/Dashboard";
import Orders from "./screens/Orders";
import StockNavigator from "./screens/StockNavigator";
import FinanceNavigator from "./screens/FinanceNavigator";
import ToDo from "./screens/ToDo";
import Settings from "./screens/Settings";
import { AppSettingsProvider, useAppSettings } from './src/core/settings/AppSettingsContext';
import SettingsHeaderButton from './src/components/SettingsHeaderButton';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  Orders: { focused: 'receipt', unfocused: 'receipt-outline' },
  'To Do': { focused: 'checkbox', unfocused: 'checkbox-outline' },
  Stock: { focused: 'cube', unfocused: 'cube-outline' },
  Finance: { focused: 'wallet', unfocused: 'wallet-outline' },
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
        headerRight: SettingsHeaderButton,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarIcon: ({ focused, color, size }) =>
          renderTabIcon(route.name, focused, color, size),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ title: t('dashboard'), tabBarLabel: t('dashboard') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="Orders"
        component={Orders}
        options={{ title: t('orders'), tabBarLabel: t('orders') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Orders' }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="To Do"
        component={ToDo}
        options={{ title: t('todo'), tabBarLabel: t('todo') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'To Do' }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="Stock"
        component={StockNavigator}
        options={{ headerShown: false, title: t('stock'), tabBarLabel: t('stock') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Stock', state: { routes: [{ name: 'StockOverview' }] } }],
              })
            );
          },
        })}
      />
      <Tab.Screen
        name="Finance"
        component={FinanceNavigator}
        options={{ headerShown: false, title: t('finance'), tabBarLabel: t('finance') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Finance', state: { routes: [{ name: 'FinanceOverview' }] } }],
              })
            );
          },
        })}
      />
    </Tab.Navigator>
  );
}

function AppShell() {
  const [session, setSession] = React.useState<Session | null>(null);
  const { colors, themeMode, t } = useAppSettings();

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
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }}>
        <RootStack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <RootStack.Screen
          name="Settings"
          component={Settings}
          options={{ title: t('settings') }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AppShell />
    </AppSettingsProvider>
  );
}
