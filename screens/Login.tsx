import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';
import { RADIUS, SHADOW_COLOR, SPACING, TYPOGRAPHY } from '../src/core/theme/tokens';

export default function Login() {
    const { colors, language, themeMode } = useAppSettings();
    const styles = React.useMemo(() => makeStyles(colors), [colors]);
    const copy = language === 'tr' ? {
        title: 'Tekrar Hoş Geldin',
        subtitle: 'Devam etmek için Yuniee Manager hesabına giriş yap.',
        email: 'E-posta Adresi',
        password: 'Şifre',
        passwordPlaceholder: 'Şifreni gir',
        signIn: 'Giriş Yap',
        error: 'Hata',
        missing: 'Lütfen e-posta ve şifre girin.',
        loginFailed: 'Giriş Başarısız',
        loginError: 'Giriş Hatası',
    } : {
        title: 'Welcome Back',
        subtitle: 'Sign in to Yuniee Manager to continue.',
        email: 'Email Address',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        signIn: 'Sign In',
        error: 'Error',
        missing: 'Please enter both email and password.',
        loginFailed: 'Login Failed',
        loginError: 'Login Error',
    };
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        StatusBar.setBarStyle(themeMode === 'dark' ? 'light-content' : 'dark-content');
    }, [themeMode]);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert(copy.error, copy.missing);
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                Alert.alert(copy.loginFailed, error.message);
                return;
            }

        } catch (err) {
            console.error("LOGIN ERROR FULL:", err);
            Alert.alert(
              copy.loginError,
              typeof err === "object" ? JSON.stringify(err) : String(err)
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.container}
            >
                <View style={styles.formContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>{copy.title}</Text>
                        <Text style={styles.subtitle}>{copy.subtitle}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{copy.email}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="user@yuniee.com"
                            placeholderTextColor={colors.text.secondary}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{copy.password}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={copy.passwordPlaceholder}
                            placeholderTextColor={colors.text.secondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.bg.page} />
                        ) : (
                            <Text style={styles.loginButtonText}>{copy.signIn}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function makeStyles(colors: ReturnType<typeof useAppSettings>['colors']) {
return StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg.page,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    headerContainer: {
        marginBottom: SPACING.xxl,
    },
    title: {
        ...TYPOGRAPHY.title,
        color: colors.text.primary,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: colors.text.secondary,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        ...TYPOGRAPHY.label,
        color: colors.text.primary,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: colors.bg.raised,
        borderWidth: 1,
        borderColor: colors.border.default,
        // Inputs are controls: RADIUS.sm, not RADIUS.md.
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        ...TYPOGRAPHY.body,
        color: colors.text.primary,
    },
    loginButton: {
        // A deliberately monochrome CTA: fills with the theme's primary
        // text color and reads with the theme's page color, so it inverts
        // cleanly in both light and dark instead of using the brand accent.
        backgroundColor: colors.text.primary,
        borderRadius: RADIUS.sm,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.md,
        shadowColor: SHADOW_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    loginButtonDisabled: {
        opacity: 0.5,
    },
    loginButtonText: {
        ...TYPOGRAPHY.label,
        color: colors.bg.page,
    },
});
}
