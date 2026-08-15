import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { SPACING, hitSlopFor } from '../../core/theme/tokens';

const CLEAR_BUTTON_SIZE = 28;

type SearchInputProps = {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    style?: StyleProp<ViewStyle>;
};

export default function SearchInput({ value, onChangeText, placeholder, style }: SearchInputProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);

    return (
        <View style={[styles.wrap, v.input, style]}>
            <Text style={[v.type.heading, styles.icon, { color: colors.text.secondary }]}>⌕</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.text.secondary}
                style={[v.type.body, styles.input, { color: colors.text.primary }]}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value ? (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => onChangeText('')}
                    hitSlop={hitSlopFor(CLEAR_BUTTON_SIZE)}
                >
                    <Text style={[v.type.title, styles.clearText, { color: colors.text.secondary }]}>×</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: 0,
    },
    icon: {},
    input: {
        flex: 1,
        minHeight: 44,
        paddingVertical: 0,
    },
    clearButton: {
        minWidth: CLEAR_BUTTON_SIZE,
        minHeight: CLEAR_BUTTON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearText: {},
});
