import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { SPACING } from '../../core/theme/tokens';

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
};

export default function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View style={styles.row}>
            <View style={styles.copy}>
                <Text style={[v.type.label, styles.title, { color: colors.text.primary }]}>{title}</Text>
                {subtitle ? <Text style={[v.type.label, styles.subtitle, { color: colors.text.secondary }]}>{subtitle}</Text> : null}
            </View>
            {right}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    copy: {
        flex: 1,
    },
    title: {
        textTransform: 'uppercase',
    },
    subtitle: {
        marginTop: SPACING.xs,
    },
});
