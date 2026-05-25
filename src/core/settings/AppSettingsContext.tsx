import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

type AppColors = {
    bg: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
};

const STORAGE_KEY = 'yuniee.appSettings.v1';

const lightColors: AppColors = {
    bg: '#f7f8fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    text: '#111827',
    subtext: '#6b7280',
    border: '#e5e7eb',
    primary: '#5867d8',
    success: '#4f9d78',
    warning: '#d89216',
    danger: '#c94f4f',
};

const darkColors: AppColors = {
    bg: '#101217',
    surface: '#181b22',
    surfaceMuted: '#20242d',
    text: '#f4f6fb',
    subtext: '#a7afbd',
    border: '#2b313c',
    primary: '#8f9aff',
    success: '#75c89d',
    warning: '#e2a84a',
    danger: '#e27d7d',
};

const translations = {
    en: {
        dashboard: 'Dashboard',
        orders: 'Orders',
        todo: 'To Do',
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
        appPreferences: 'App preferences',
        ownerMode: 'Owner/admin workspace',
    },
    tr: {
        dashboard: 'Panel',
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
