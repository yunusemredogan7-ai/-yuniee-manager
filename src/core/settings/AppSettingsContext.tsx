import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorTokens, darkColors, lightColors } from '../theme/tokens';

export type AppThemeMode = 'light' | 'dark';
export type AppLanguage = 'en' | 'tr';

type AppSettingsContextValue = {
    themeMode: AppThemeMode;
    language: AppLanguage;
    todoNotificationsEnabled: boolean;
    setThemeMode: (mode: AppThemeMode) => void;
    setLanguage: (language: AppLanguage) => void;
    setTodoNotificationsEnabled: (enabled: boolean) => void;
    t: (key: TranslationKey) => string;
    colors: AppColors;
};

/** Re-exported so existing `import { AppColors } from '.../AppSettingsContext'`
 * call sites keep working — the actual token values live in `src/core/theme/tokens.ts`. */
export type AppColors = ColorTokens;

const STORAGE_KEY = 'yuniee.appSettings.v1';

const translations = {
    en: {
        dashboard: 'Today',
        orders: 'Orders',
        todo: 'To do',
        stock: 'Stock',
        finance: 'Finance',
        settings: 'Settings',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        language: 'Language',
        english: 'İngilizce',
        turkish: 'Türkçe',
        notifications: 'Notifications',
        todoReminders: 'To Do reminders',
        todoRemindersNote: 'Local reminder delivery requires native notification setup.',
        pushNotifications: 'iOS push notifications',
        pushNotificationsNote: 'Get notified for new orders, packing tasks, low stock, and waiting tasks.',
        pushNotConfigured: 'Push not configured',
        enabled: 'Enabled',
        openIosSettings: 'Open iOS Settings',
        notificationEvents: 'Notification events',
        requestPermission: 'Enable notifications',
        checking: 'Checking...',
        tokenSaved: 'Token saved',
        permissionDenied: 'Permission denied',
        tokenUnavailable: 'Token unavailable',
        appPreferences: 'App preferences',
        ownerMode: 'Owner/admin workspace',
    },
    tr: {
        dashboard: 'Bugün',
        orders: 'Siparişler',
        todo: 'Yapılacaklar',
        stock: 'Stok',
        finance: 'Finans',
        settings: 'Ayarlar',
        theme: 'Tema',
        light: 'Açık',
        dark: 'Koyu',
        language: 'Dil',
        english: 'English',
        turkish: 'Türkçe',
        notifications: 'Bildirimler',
        todoReminders: 'Yapılacak hatırlatmaları',
        todoRemindersNote: 'Yerel hatırlatmalar için bildirim kurulumu gerekir.',
        pushNotifications: 'iOS anlık bildirimleri',
        pushNotificationsNote: 'Yeni sipariş, paketleme görevi, düşük stok ve bekleyen görevler için bildirim alın.',
        pushNotConfigured: 'Push kurulmadı',
        enabled: 'Açık',
        openIosSettings: 'iOS Ayarlarını Aç',
        notificationEvents: 'Bildirim olayları',
        requestPermission: 'Bildirimleri aç',
        checking: 'Kontrol ediliyor...',
        tokenSaved: 'Token kaydedildi',
        permissionDenied: 'İzin reddedildi',
        tokenUnavailable: 'Token alınamadı',
        appPreferences: 'Uygulama tercihleri',
        ownerMode: 'Sahip/admin çalışma alanı',
    },
} as const;

type TranslationKey = keyof typeof translations.en;

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeModeState] = useState<AppThemeMode>('light');
    const [language, setLanguageState] = useState<AppLanguage>('en');
    const [todoNotificationsEnabled, setTodoNotificationsEnabledState] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(value => {
            if (!value) return;
            try {
                const parsed = JSON.parse(value) as Partial<{
                    themeMode: AppThemeMode;
                    language: AppLanguage;
                    todoNotificationsEnabled: boolean;
                }>;
                if (parsed.themeMode === 'light' || parsed.themeMode === 'dark') setThemeModeState(parsed.themeMode);
                if (parsed.language === 'en' || parsed.language === 'tr') setLanguageState(parsed.language);
                if (typeof parsed.todoNotificationsEnabled === 'boolean') {
                    setTodoNotificationsEnabledState(parsed.todoNotificationsEnabled);
                }
            } catch {
                // Keep defaults if local settings are corrupted.
            }
        });
    }, []);

    const persist = (next: Partial<{ themeMode: AppThemeMode; language: AppLanguage; todoNotificationsEnabled: boolean }>) => {
        const payload = {
            themeMode,
            language,
            todoNotificationsEnabled,
            ...next,
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
    };

    const setThemeMode = (mode: AppThemeMode) => {
        setThemeModeState(mode);
        persist({ themeMode: mode });
    };

    const setLanguage = (nextLanguage: AppLanguage) => {
        setLanguageState(nextLanguage);
        persist({ language: nextLanguage });
    };

    const setTodoNotificationsEnabled = (enabled: boolean) => {
        setTodoNotificationsEnabledState(enabled);
        persist({ todoNotificationsEnabled: enabled });
    };

    const value = useMemo<AppSettingsContextValue>(() => ({
        themeMode,
        language,
        todoNotificationsEnabled,
        setThemeMode,
        setLanguage,
        setTodoNotificationsEnabled,
        colors: themeMode === 'dark' ? darkColors : lightColors,
        t: key => translations[language][key] ?? translations.en[key],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [themeMode, language, todoNotificationsEnabled]);

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const ctx = useContext(AppSettingsContext);
    if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
    return ctx;
}
