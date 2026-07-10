import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppLanguage, AppThemeMode, useAppSettings } from '../src/core/settings/AppSettingsContext';
import { Card, SegmentedControl } from '../src/components/ui';
import { spacing, radii } from '../src/core/design/tokens';
import { typography } from '../src/core/design/typography';

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

    const styles = React.useMemo(() => makeStyles(colors), [colors]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={[typography.overline, { color: colors.textMuted, marginBottom: 4 }]}>
                {t('ownerMode').toUpperCase()}
            </Text>
            <Text style={[typography.display, { color: colors.text }]}>{t('settings')}</Text>
            <Text style={[typography.body, { color: colors.subtext, marginTop: 4, marginBottom: spacing.xl }]}>
                {t('appPreferences')}
            </Text>

            <Card style={styles.card} padding="xl">
                <View style={styles.cardHeader}>
                    <Icon name="color-palette-outline" size={18} color={colors.primary} />
                    <Text style={[typography.h3, { color: colors.text }]}>{t('theme')}</Text>
                </View>
                <SegmentedControl<AppThemeMode>
                    value={themeMode}
                    onChange={setThemeMode}
                    options={[
                        { value: 'light', label: t('light') },
                        { value: 'dark', label: t('dark') },
                    ]}
                />
            </Card>

            <Card style={styles.card} padding="xl">
                <View style={styles.cardHeader}>
                    <Icon name="language-outline" size={18} color={colors.primary} />
                    <Text style={[typography.h3, { color: colors.text }]}>{t('language')}</Text>
                </View>
                <SegmentedControl<AppLanguage>
                    value={language}
                    onChange={setLanguage}
                    options={[
                        { value: 'en', label: t('english') },
                        { value: 'tr', label: t('turkish') },
                    ]}
                />
            </Card>

            <Card style={styles.card} padding="xl">
                <View style={styles.cardHeader}>
                    <Icon name="notifications-outline" size={18} color={colors.primary} />
                    <Text style={[typography.h3, { color: colors.text }]}>{t('notifications')}</Text>
                </View>
                <Toggle
                    label={t('todoReminders')}
                    description={t('todoRemindersNote')}
                    value={todoNotificationsEnabled}
                    onChange={setTodoNotificationsEnabled}
                />
            </Card>
        </ScrollView>
    );
}

function Toggle({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description?: string;
    value: boolean;
    onChange: (next: boolean) => void;
}) {
    const { colors } = useAppSettings();
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(anim, {
            toValue: value ? 1 : 0,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [value, anim]);

    const knobLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 24] });
    const bg = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surfaceSunken, colors.primary],
    });

    return (
        <Pressable
            style={toggleStyles.row}
            onPress={() => onChange(!value)}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
        >
            <View style={{ flex: 1 }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{label}</Text>
                {description ? (
                    <Text style={[typography.caption, { color: colors.subtext, marginTop: 2 }]}>
                        {description}
                    </Text>
                ) : null}
            </View>
            <Animated.View
                style={[
                    toggleStyles.track,
                    { backgroundColor: bg, borderColor: colors.border },
                ]}
            >
                <Animated.View
                    style={[
                        toggleStyles.knob,
                        { left: knobLeft, backgroundColor: colors.textInverse },
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}

const toggleStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    track: {
        width: 50,
        height: 28,
        borderRadius: radii.pill,
        borderWidth: StyleSheet.hairlineWidth,
        position: 'relative',
    },
    knob: {
        position: 'absolute',
        top: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
});

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors']) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        content: { padding: spacing.xl, paddingBottom: spacing.huge },
        card: {
            marginBottom: spacing.md,
            gap: spacing.md,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
    });
}
