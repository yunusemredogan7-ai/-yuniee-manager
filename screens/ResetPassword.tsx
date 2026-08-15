import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { Button, Card, Input } from '../src/components/ui';
import { radii, spacing, motion, elevation } from '../src/core/design/tokens';
import { typography } from '../src/core/design/typography';

interface ResetPasswordProps {
    onSuccess?: () => void;
}

export default function ResetPassword({ onSuccess }: ResetPasswordProps) {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        brand: 'YUNIEE MANAGER',
        title: 'Yeni Şifre Belirle',
        subtitle: 'Hesabın için yeni ve güçlü bir şifre gir.',
        newPassword: 'Yeni Şifre',
        newPasswordPlaceholder: 'En az 6 karakter',
        confirmPassword: 'Şifre Tekrarı',
        confirmPasswordPlaceholder: 'Şifreni tekrar gir',
        updateBtn: 'Şifreyi Güncelle',
        missing: 'Lütfen tüm alanları doldurun.',
        lengthError: 'Şifre en az 6 karakter olmalıdır.',
        mismatch: 'Şifreler birbiriyle eşleşmiyor.',
        updateSuccess: 'Şifreniz başarıyla güncellendi!',
        updateFailed: 'Şifre güncellenemedi.',
    } : {
        brand: 'YUNIEE MANAGER',
        title: 'Set New Password',
        subtitle: 'Enter a new, strong password for your account.',
        newPassword: 'New Password',
        newPasswordPlaceholder: 'At least 6 characters',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Re-enter your password',
        updateBtn: 'Update Password',
        missing: 'Please fill in all fields.',
        lengthError: 'Password must be at least 6 characters long.',
        mismatch: 'Passwords do not match.',
        updateSuccess: 'Password updated successfully!',
        updateFailed: 'Failed to update password.',
    };

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        StatusBar.setBarStyle(themeMode === 'dark' ? 'light-content' : 'dark-content');
    }, [themeMode]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: motion.slow, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    async function handleResetPassword() {
        setError(null);
        setSuccessMessage(null);

        if (!password || !confirmPassword) {
            setError(copy.missing);
            return;
        }

        if (password.length < 6) {
            setError(copy.lengthError);
            return;
        }

        if (password !== confirmPassword) {
            setError(copy.mismatch);
            return;
        }

        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                setError(updateError.message || copy.updateFailed);
            } else {
                setSuccessMessage(copy.updateSuccess);
                setTimeout(() => {
                    onSuccess?.();
                }, 1200);
            }
        } catch (err: any) {
            console.error('RESET PASSWORD ERROR:', err);
            setError(err?.message || copy.updateFailed);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.bgOrnamentTop} pointerEvents="none" />
            <View style={styles.bgOrnamentBottom} pointerEvents="none" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <Animated.View
                    style={[
                        styles.formContainer,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <View style={styles.brandRow}>
                        <View style={styles.brandMark}>
                            <Text style={styles.brandMarkText}>Y</Text>
                        </View>
                        <Text style={[typography.overline, { color: colors.textMuted }]}>
                            {copy.brand}
                        </Text>
                    </View>

                    <Text style={[typography.display, { color: colors.text, marginTop: spacing.lg }]}>
                        {copy.title}
                    </Text>
                    <Text style={[typography.body, { color: colors.subtext, marginTop: 6 }]}>
                        {copy.subtitle}
                    </Text>

                    <Card style={styles.formCard} elevated="lg" padding="xl">
                        {successMessage ? (
                            <View style={styles.successBox}>
                                <Icon name="checkmark-circle-outline" size={24} color={colors.success} />
                                <Text style={[typography.body, { color: colors.success, marginTop: spacing.xs, textAlign: 'center' }]}>
                                    {successMessage}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Input
                                    label={copy.newPassword}
                                    placeholder={copy.newPasswordPlaceholder}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType="newPassword"
                                    editable={!loading}
                                    leftAddon={<Icon name="lock-closed-outline" size={18} color={colors.subtext} />}
                                    rightAddon={
                                        <Icon
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color={colors.subtext}
                                            onPress={() => setShowPassword(s => !s)}
                                        />
                                    }
                                    containerStyle={{ marginBottom: spacing.md }}
                                />

                                <Input
                                    label={copy.confirmPassword}
                                    placeholder={copy.confirmPasswordPlaceholder}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType="newPassword"
                                    editable={!loading}
                                    leftAddon={<Icon name="lock-closed-outline" size={18} color={colors.subtext} />}
                                    error={error ?? undefined}
                                    containerStyle={{ marginBottom: spacing.lg }}
                                />

                                <Button
                                    label={copy.updateBtn}
                                    onPress={handleResetPassword}
                                    loading={loading}
                                    size="lg"
                                    fullWidth
                                    rightIcon={
                                        !loading ? (
                                            <Icon name="checkmark-sharp" size={18} color={colors.textInverse} />
                                        ) : null
                                    }
                                />
                            </>
                        )}
                    </Card>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function makeStyles(
    colors: ReturnType<typeof useAppSettings>['colors'],
    themeMode: 'light' | 'dark',
) {
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: colors.bg,
        },
        bgOrnamentTop: {
            position: 'absolute',
            top: -140,
            right: -140,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: colors.primarySoft,
            opacity: themeMode === 'dark' ? 0.6 : 0.7,
        },
        bgOrnamentBottom: {
            position: 'absolute',
            bottom: -160,
            left: -160,
            width: 360,
            height: 360,
            borderRadius: 180,
            backgroundColor: colors.successSoft,
            opacity: themeMode === 'dark' ? 0.35 : 0.6,
        },
        container: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: spacing.xxl,
        },
        formContainer: {
            width: '100%',
            maxWidth: 420,
            alignSelf: 'center',
        },
        brandRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm + 2,
        },
        brandMark: {
            width: 40,
            height: 40,
            borderRadius: radii.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...elevation('md', themeMode),
        },
        brandMarkText: {
            color: colors.textInverse,
            fontSize: 20,
            fontWeight: '900',
        },
        formCard: {
            marginTop: spacing.xxl,
        },
        successBox: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.md,
        },
    });
}
