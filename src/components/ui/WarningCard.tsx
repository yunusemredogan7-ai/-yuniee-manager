import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { RADIUS, SPACING, StatusTone } from '../../core/theme/tokens';

type WarningCardTone = 'warning' | 'danger' | 'info' | 'success';

type WarningCardProps = {
    title: string;
    description?: string;
    tone?: WarningCardTone;
    style?: StyleProp<ViewStyle>;
};

export default function WarningCard({ title, description, tone = 'warning', style }: WarningCardProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    const statusTone: StatusTone = tone;
    // Card surface is tinted with this status's `.bg`, so its text must use
    // the matching `.fg` — never the generic text.primary/secondary.
    const fg = colors.status[statusTone].fg;
    const surface =
        tone === 'danger' ? v.dangerSurface :
        tone === 'success' ? v.successSurface :
        tone === 'info' ? v.infoSurface :
        v.warningSurface;

    return (
        <View style={[styles.card, surface, { borderRadius: RADIUS.md }, style]}>
            <View style={[styles.dot, { backgroundColor: fg }]} />
            <View style={styles.body}>
                <Text style={[v.type.label, styles.title, { color: fg }]}>{title}</Text>
                {description ? <Text style={[v.type.caption, styles.desc, { color: fg }]}>{description}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        borderWidth: 1,
        padding: SPACING.md,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: RADIUS.pill,
        marginTop: SPACING.xs,
    },
    body: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
    },
    desc: {
        marginTop: SPACING.xs,
        opacity: 0.85,
    },
});
