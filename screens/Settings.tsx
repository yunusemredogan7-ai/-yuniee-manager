import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppLanguage, AppThemeMode, useAppSettings } from '../src/core/settings/AppSettingsContext';

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

    const styles = makeStyles(colors);

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
            </View>
        </ScrollView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors']) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { padding: 20, paddingBottom: 44 },
        title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
        subtitle: { fontSize: 14, color: colors.subtext, marginTop: 4, marginBottom: 20 },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 14,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: '800',
            color: colors.subtext,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 14,
        },
        settingBlock: { marginBottom: 18 },
        settingLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
        segmentGroup: {
            flexDirection: 'row',
            backgroundColor: colors.surfaceMuted,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
        },
        segment: {
            flex: 1,
            minHeight: 40,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
        },
        segmentActive: { backgroundColor: colors.primary },
        segmentText: { fontSize: 14, fontWeight: '700', color: colors.subtext },
        segmentTextActive: { color: '#fff' },
        toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
        toggleTextWrap: { flex: 1 },
        helpText: { fontSize: 13, color: colors.subtext, lineHeight: 18 },
        toggleTrack: {
            width: 52,
            height: 30,
            borderRadius: 15,
            backgroundColor: colors.surfaceMuted,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 3,
        },
        toggleTrackActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        toggleKnob: {
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.surface,
        },
        toggleKnobActive: { transform: [{ translateX: 21 }], backgroundColor: '#fff' },
    });
}
