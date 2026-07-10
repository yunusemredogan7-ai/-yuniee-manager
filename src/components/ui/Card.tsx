import React from 'react';
import { StyleSheet, View, type ViewStyle, type ViewProps } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii, spacing, elevation, type Elevation } from '../../core/design/tokens';

type CardProps = ViewProps & {
    children: React.ReactNode;
    padding?: keyof typeof spacing | number;
    elevated?: Elevation;
    bordered?: boolean;
    muted?: boolean;
    style?: ViewStyle | ViewStyle[];
};

export function Card({
    children,
    padding = 'lg',
    elevated = 'sm',
    bordered = true,
    muted = false,
    style,
    ...rest
}: CardProps) {
    const { colors, themeMode } = useAppSettings();
    const padValue = typeof padding === 'number' ? padding : spacing[padding];

    return (
        <View
            {...rest}
            style={[
                {
                    backgroundColor: muted ? colors.surfaceMuted : colors.surfaceElevated,
                    borderRadius: radii.lg,
                    borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
                    borderColor: colors.border,
                    padding: padValue,
                },
                elevation(elevated, themeMode),
                style,
            ]}
        >
            {children}
        </View>
    );
}
