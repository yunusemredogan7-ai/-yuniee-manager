import { Platform } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { supabase } from '../core/supabase/client';

export type PushPermissionState =
    | 'not_supported'
    | 'permission_denied'
    | 'permission_granted'
    | 'token_saved'
    | 'token_unavailable'
    | 'error';

export type PushTokenResult = {
    state: PushPermissionState;
    token?: string;
    message?: string;
};

export type StoredPushToken = {
    id: string;
    user_id: string;
    token: string;
    platform: string;
    device_name: string | null;
    app_version: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

const APP_VERSION = '0.0.1';
const TOKEN_TIMEOUT_MS = 12000;

function hasPermission(permissions: { alert?: boolean; badge?: boolean; sound?: boolean } | null | undefined): boolean {
    return Boolean(permissions?.alert || permissions?.badge || permissions?.sound);
}

function waitForDeviceToken(): Promise<PushTokenResult> {
    return new Promise(resolve => {
        let settled = false;
        const cleanup = () => {
            PushNotificationIOS.removeEventListener('register');
            PushNotificationIOS.removeEventListener('registrationError');
        };
        const settle = (result: PushTokenResult) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(result);
        };

        PushNotificationIOS.addEventListener('register', token => {
            settle({ state: 'permission_granted', token });
        });
        PushNotificationIOS.addEventListener('registrationError', error => {
            settle({
                state: 'token_unavailable',
                message: error?.message || 'Device token is unavailable. This can happen on simulator or before APNs setup is complete.',
            });
        });

        setTimeout(() => {
            settle({
                state: 'token_unavailable',
                message: 'Device token was not returned. Confirm iOS Push Notifications capability and AppDelegate integration.',
            });
        }, TOKEN_TIMEOUT_MS);
    });
}

export const pushTokenService = {
    async checkPermissionStatus(): Promise<PushTokenResult> {
        if (Platform.OS !== 'ios') {
            return { state: 'not_supported', message: 'Push token registration is currently configured for iOS only.' };
        }

        try {
            const permissions = await new Promise<{ alert?: boolean; badge?: boolean; sound?: boolean }>(resolve => {
                PushNotificationIOS.checkPermissions(resolve);
            });
            return {
                state: hasPermission(permissions) ? 'permission_granted' : 'permission_denied',
                message: hasPermission(permissions) ? 'Notification permission is enabled.' : 'Notification permission is not enabled.',
            };
        } catch (error) {
            return {
                state: 'error',
                message: error instanceof Error ? error.message : 'Could not check notification permission.',
            };
        }
    },

    async requestPermissionAndRegisterToken(): Promise<PushTokenResult> {
        if (Platform.OS !== 'ios') {
            return { state: 'not_supported', message: 'Push token registration is currently configured for iOS only.' };
        }

        try {
            const tokenPromise = waitForDeviceToken();
            const permissions = await PushNotificationIOS.requestPermissions({
                alert: true,
                badge: true,
                sound: true,
            });

            if (!hasPermission(permissions)) {
                return {
                    state: 'permission_denied',
                    message: 'Notification permission was denied. Enable notifications from iOS Settings to register this device.',
                };
            }

            const tokenResult = await tokenPromise;
            if (!tokenResult.token) return tokenResult;
            return this.upsertPushToken(tokenResult.token);
        } catch (error) {
            return {
                state: 'error',
                message: error instanceof Error ? error.message : 'Could not request notification permission.',
            };
        }
    },

    async upsertPushToken(token: string): Promise<PushTokenResult> {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;
        if (userError || !user) {
            return { state: 'error', token, message: 'No authenticated user is available for push token storage.' };
        }

        const { error } = await supabase
            .from('user_push_tokens')
            .upsert({
                user_id: user.id,
                token,
                platform: 'ios',
                device_name: Platform.OS,
                app_version: APP_VERSION,
                is_active: true,
                updated_at: new Date().toISOString(),
            } as any, { onConflict: 'user_id,token' });

        if (error) {
            return {
                state: 'error',
                token,
                message: error.message || 'Could not save push token. Confirm the user_push_tokens migration has been applied.',
            };
        }

        return { state: 'token_saved', token, message: 'Push token saved for this device.' };
    },

    async deactivatePushToken(token: string): Promise<PushTokenResult> {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return { state: 'error', token, message: 'No authenticated user is available.' };

        const { error } = await supabase
            .from('user_push_tokens')
            .update({ is_active: false, updated_at: new Date().toISOString() } as any)
            .eq('user_id', user.id)
            .eq('token', token);

        if (error) {
            return { state: 'error', token, message: error.message || 'Could not deactivate push token.' };
        }
        return { state: 'permission_granted', token, message: 'Push token deactivated.' };
    },

    async getCurrentUserTokens(): Promise<{ data: StoredPushToken[] | null; error: unknown }> {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return { data: null, error: new Error('No authenticated user is available.') };

        const { data, error } = await supabase
            .from('user_push_tokens')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        return { data: data as StoredPushToken[] | null, error };
    },
};
