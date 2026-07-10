import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { radii } from '../../core/design/tokens';

type SkeletonProps = {
    width?: number | `${number}%`;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, borderRadius = radii.sm, style }: SkeletonProps) {
    const { colors } = useAppSettings();
    const opacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.surfaceMuted,
                    opacity,
                },
                style,
            ]}
        />
    );
}

type SkeletonGroupProps = {
    children: React.ReactNode;
    style?: ViewStyle;
};

export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
    return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    group: {
        gap: 10,
    },
});
