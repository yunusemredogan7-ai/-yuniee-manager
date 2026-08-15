import React from "react";
import { NavigationContainer, CommonActions, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import { supabase } from './src/core/supabase/client';
import { Session } from '@supabase/supabase-js';
import Icon from 'react-native-vector-icons/Ionicons';

import Login from './screens/Login';
import ResetPassword from './screens/ResetPassword';
import { Linking } from 'react-native';

import Dashboard from "./screens/Dashboard";
import Orders from "./screens/Orders";
import StockNavigator from "./screens/StockNavigator";
import FinanceNavigator from "./screens/FinanceNavigator";
import ToDo from "./screens/ToDo";
import Settings from "./screens/Settings";
import { AppSettingsProvider, useAppSettings } from './src/core/settings/AppSettingsContext';
import SettingsHeaderButton from './src/components/SettingsHeaderButton';
import { radii, spacing } from './src/core/design/tokens';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  Orders: { focused: 'receipt', unfocused: 'receipt-outline' },
  'To Do': { focused: 'checkbox', unfocused: 'checkbox-outline' },
  Stock: { focused: 'cube', unfocused: 'cube-outline' },
  Finance: { focused: 'wallet', unfocused: 'wallet-outline' },
};

function TabIcon({
  routeName,
  focused,
  color,
  activeBackground,
}: {
  routeName: string;
  focused: boolean;
  color: string;
  activeBackground: string;
}) {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Dashboard;
  const iconName = focused ? icons.focused : icons.unfocused;
  return (
    <View
      style={{
        width: 44,
        height: 30,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? activeBackground : 'transparent',
      }}
    >
      <Icon name={iconName} size={20} color={color} />
    </View>
  );
}

function TabNavigator() {
  const { colors, t, themeMode } = useAppSettings();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: SettingsHeaderButton,
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: -0.2,
          color: colors.text,
        },
        headerTitleAlign: 'left',
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            routeName={route.name}
            focused={focused}
            color={color}
            activeBackground={colors.primarySoft}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingTop: spacing.sm,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.divider,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 14,
          shadowColor: themeMode === 'dark' ? '#000' : '#0b1220',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: themeMode === 'dark' ? 0.4 : 0.08,
          shadowRadius: 14,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
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

function parseSupabaseUrl(url: string) {
  const hash = url.split('#')[1];
  const query = url.split('?')[1];
  const params: Record<string, string> = {};

  const target = hash || query;
  if (target) {
    target.split('&').forEach((part) => {
      const [key, val] = part.split('=');
      if (key && val) {
        params[key] = decodeURIComponent(val);
      }
    });
  }
  return params;
}

function AppShell() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = React.useState(false);
  const { colors, themeMode, t } = useAppSettings();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      const params = parseSupabaseUrl(url);
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        setIsPasswordRecovery(true);
      } else if (params.code) {
        await supabase.auth.exchangeCodeForSession(params.code);
        setIsPasswordRecovery(true);
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const linkingSub = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
      }
    );

    return () => {
      linkingSub.remove();
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isPasswordRecovery) {
    return <ResetPassword onSuccess={() => setIsPasswordRecovery(false)} />;
  }

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
