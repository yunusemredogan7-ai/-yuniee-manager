import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppLanguage, AppThemeMode, useAppSettings } from '../src/core/settings/AppSettingsContext';
import { createVisualSystem } from '../src/core/theme/visualSystem';
import { PushNotificationSettings } from '../src/components/ui';
import { RADIUS, SPACING } from '../src/core/theme/tokens';

export default function Settings() {
    const {
        colors,
        language,
        setLanguage,
        setThemeMode,
        setTodoNotificationsEnabled,
        t,
        themeMode,
        todoNotificationsEnabled,
    } = useAppSettings();

    const styles = makeStyles(colors, themeMode);

    function renderSegment<T extends string>(value: T, current: T, label: string, onPress: (value: T) => void) {
        const selected = value === current;
        return (
            <TouchableOpacity
                key={value}
                style={[styles.segment, selected && styles.segmentActive]}
                onPress={() => onPress(value)}
            >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('settings')}</Text>
            <Text style={styles.subtitle}>{t('ownerMode')}</Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('appPreferences')}</Text>

                <View style={styles.settingBlock}>
                    <Text style={styles.settingLabel}>{t('theme')}</Text>
                    <View style={styles.segmentGroup}>
                        {renderSegment<AppThemeMode>('light', themeMode, t('light'), setThemeMode)}
                        {renderSegment<AppThemeMode>('dark', themeMode, t('dark'), setThemeMode)}
                    </View>
                </View>

                <View style={styles.settingBlock}>
                    <Text style={styles.settingLabel}>{t('language')}</Text>
                    <View style={styles.segmentGroup}>
                        {renderSegment<AppLanguage>('en', language, t('english'), setLanguage)}
                        {renderSegment<AppLanguage>('tr', language, t('turkish'), setLanguage)}
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('notifications')}</Text>
                <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => setTodoNotificationsEnabled(!todoNotificationsEnabled)}
                >
                    <View style={styles.toggleTextWrap}>
                        <Text style={styles.settingLabel}>{t('todoReminders')}</Text>
                        <Text style={styles.helpText}>{t('todoRemindersNote')}</Text>
                    </View>
                    <View style={[styles.toggleTrack, todoNotificationsEnabled && styles.toggleTrackActive]}>
                        <View style={[styles.toggleKnob, todoNotificationsEnabled && styles.toggleKnobActive]} />
                    </View>
                </TouchableOpacity>
                <PushNotificationSettings
                    title={t('pushNotifications')}
                    description={t('pushNotificationsNote')}
                    enabledLabel={t('enabled')}
                    notConfiguredLabel={t('pushNotConfigured')}
                    openSettingsLabel={t('openIosSettings')}
                    eventsLabel={t('notificationEvents')}
                    requestPermissionLabel={t('requestPermission')}
                    checkingLabel={t('checking')}
                    tokenSavedLabel={t('tokenSaved')}
                    permissionDeniedLabel={t('permissionDenied')}
                    tokenUnavailableLabel={t('tokenUnavailable')}
                />
            </View>
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors'], themeMode: 'light' | 'dark') {
    const v = createVisualSystem(colors, themeMode);
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg.page },
        content: { padding: SPACING.lg, paddingBottom: SPACING.xxl + SPACING.md },
        title: { ...v.type.title, color: colors.text.primary },
        subtitle: { ...v.type.body, color: colors.text.secondary, marginTop: SPACING.xs, marginBottom: SPACING.xl },
        card: {
            ...v.card,
            marginBottom: SPACING.md,
        },
        sectionTitle: {
            ...v.type.label,
            color: colors.text.secondary,
            textTransform: 'uppercase',
            marginBottom: SPACING.md,
        },
        settingBlock: { marginBottom: SPACING.lg },
        settingLabel: { ...v.type.body, fontWeight: '700', color: colors.text.primary, marginBottom: SPACING.sm },
        segmentGroup: {
            flexDirection: 'row',
            backgroundColor: colors.bg.raised,
            borderRadius: RADIUS.md,
            padding: SPACING.xs,
            borderWidth: 1,
            borderColor: colors.border.default,
        },
        segment: {
            flex: 1,
            minHeight: 44,
            borderRadius: RADIUS.sm,
            alignItems: 'center',
            justifyContent: 'center',
        },
        segmentActive: { backgroundColor: colors.accent.bg },
        segmentText: { ...v.type.body, fontWeight: '700', color: colors.text.secondary },
        segmentTextActive: { color: colors.accent.fg },
        toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.lg },
        toggleTextWrap: { flex: 1 },
        helpText: { ...v.type.label, color: colors.text.secondary },
        toggleTrack: {
            width: 52,
            height: 30,
            borderRadius: RADIUS.pill,
            backgroundColor: colors.bg.raised,
            borderWidth: 1,
            borderColor: colors.border.default,
            padding: 3,
        },
        toggleTrackActive: { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg },
        toggleKnob: {
            width: 22,
            height: 22,
            borderRadius: RADIUS.pill,
            backgroundColor: colors.bg.surface,
        },
        // Track inverts brightness by theme (like accent.bg everywhere else),
        // so the knob needs accent.fg to stay visible, not a fixed white.
        toggleKnobActive: { transform: [{ translateX: 21 }], backgroundColor: colors.accent.fg },
    });
}
