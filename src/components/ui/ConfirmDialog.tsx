import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSettings } from '../../core/settings/AppSettingsContext';
import { createVisualSystem } from '../../core/theme/visualSystem';
import { OVERLAY_SCRIM, RADIUS, SPACING } from '../../core/theme/tokens';

type ConfirmDialogProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    destructive,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { colors, themeMode } = useAppSettings();
    const v = createVisualSystem(colors, themeMode);
    // A solid saturated danger fill with white text can't be made to pass
    // contrast in both themes (danger.fg is dark-on-light in light mode but
    // light-on-dark in dark mode) — so destructive uses the same tint+fg
    // pairing as every other status surface instead of a solid fill.
    const confirmColors = destructive
        ? { backgroundColor: colors.status.danger.bg, borderColor: colors.status.danger.fg, textColor: colors.status.danger.fg }
        : { backgroundColor: colors.accent.bg, borderColor: colors.accent.bg, textColor: colors.accent.fg };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: colors.bg.surface, borderColor: colors.border.default, borderRadius: RADIUS.md }]}>
                    <Text style={[v.type.title, styles.title, { color: colors.text.primary }]}>{title}</Text>
                    <Text style={[v.type.body, { color: colors.text.secondary }]}>{message}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.cancel, v.secondaryButton]} onPress={onCancel}>
                            <Text style={[v.type.label, { color: colors.text.primary }]}>{cancelLabel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirm, v.primaryButton, {
                                backgroundColor: confirmColors.backgroundColor,
                                borderWidth: destructive ? 1 : 0,
                                borderColor: confirmColors.borderColor,
                                shadowColor: confirmColors.backgroundColor,
                            }]}
                            onPress={onConfirm}
                        >
                            <Text style={[v.type.label, { color: confirmColors.textColor }]}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: OVERLAY_SCRIM,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    card: {
        borderWidth: 1,
        padding: SPACING.lg,
    },
    title: {
        marginBottom: SPACING.sm,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    cancel: {
        flex: 1,
    },
    confirm: {
        flex: 1,
    },
});
