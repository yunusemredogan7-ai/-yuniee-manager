import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../src/core/supabase/client';
import { useAppSettings } from '../src/core/settings/AppSettingsContext';

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
                            placeholderTextColor="#9CA3AF"
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
                            placeholderTextColor="#9CA3AF"
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
                            <ActivityIndicator color="#FFFFFF" />
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
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    headerContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.subtext,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.text,
    },
    loginButton: {
        backgroundColor: colors.text,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    loginButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
}
