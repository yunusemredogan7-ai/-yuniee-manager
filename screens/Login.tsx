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

export default function Login() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors, themeMode), [colors, themeMode]);
    const copy = language === 'tr' ? {
        brand: 'YUNIEE MANAGER',
        title: 'Tekrar Hoş Geldin',
        subtitle: 'Devam etmek için hesabına giriş yap.',
        email: 'E-posta Adresi',
        password: 'Şifre',
        passwordPlaceholder: 'Şifreni gir',
        signIn: 'Giriş Yap',
        missing: 'Lütfen e-posta ve şifre girin.',
        loginFailed: 'Giriş başarısız.',
        privateNote: 'Bu özel bir yönetim panelidir. Yalnızca yetkili kullanıcılar.',
    } : {
        brand: 'YUNIEE MANAGER',
        title: 'Welcome back',
        subtitle: 'Sign in to continue to your workspace.',
        email: 'Email address',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        signIn: 'Sign in',
        missing: 'Please enter both email and password.',
        loginFailed: 'Sign-in failed.',
        privateNote: 'Private admin workspace. Authorized users only.',
    };
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    async function handleLogin() {
        setError(null);
        if (!email || !password) {
            setError(copy.missing);
            return;
        }

        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (authError) {
                setError(authError.message || copy.loginFailed);
            }
        } catch (err) {
            console.error('LOGIN ERROR FULL:', err);
            setError(typeof err === 'object' ? JSON.stringify(err) : String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.bgOrnamentTop} pointerEvents="none" />
            <View style={styles.bgOrnamentBottom} pointerEvents="none" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                        <Input
                            label={copy.email}
                            placeholder="you@yuniee.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                            leftAddon={<Icon name="mail-outline" size={18} color={colors.subtext} />}
                            containerStyle={{ marginBottom: spacing.md }}
                        />
                        <Input
                            label={copy.password}
                            placeholder={copy.passwordPlaceholder}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
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
                            error={error ?? undefined}
                            containerStyle={{ marginBottom: spacing.lg }}
                        />

                        <Button
                            label={copy.signIn}
                            onPress={handleLogin}
                            loading={loading}
                            size="lg"
                            fullWidth
                            rightIcon={
                                !loading ? (
                                    <Icon name="arrow-forward" size={18} color={colors.textInverse} />
                                ) : null
                            }
                        />
                    </Card>

                    <View style={styles.footerRow}>
                        <Icon name="shield-checkmark-outline" size={14} color={colors.textMuted} />
                        <Text style={[typography.caption, { color: colors.textMuted }]}>
                            {copy.privateNote}
                        </Text>
                    </View>
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
        footerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: spacing.xl,
        },
    });
}
