import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';

type PremiumCardProps = {
    children: React.ReactNode;
    compact?: boolean;
    accentColor?: string;
    style?: StyleProp<ViewStyle>;
};

export default function PremiumCard({ children, compact, accentColor, style }: PremiumCardProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View
            style={[
                compact ? v.cardCompact : v.card,
                accentColor ? [styles.accent, { borderLeftColor: accentColor }] : null,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    accent: {
        borderLeftWidth: 3,
    },
});
