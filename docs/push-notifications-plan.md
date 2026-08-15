# Push Notifications Plan

## Project Setup Findings

Yuniee Manager is a bare React Native app, not an Expo app.

Evidence:

- `package.json` uses `react-native` scripts: `react-native run-ios`, `react-native run-android`
- Native iOS project exists under `ios/`
- No `expo`, `expo-notifications`, `eas.json`, or `app.config.js`
- No Firebase config files such as `GoogleService-Info.plist`
- No existing Supabase Edge Functions folder
- No existing device-token storage table existed before this pass
- `@react-native-community/push-notification-ios` is now installed for iOS APNs permission/token registration

## Recommended Architecture

The safest architecture for this app is:

1. React Native app requests notification permission and registers an iOS device token.
2. App stores device tokens in Supabase.
3. Important app actions prepare typed notification events.
4. Supabase Edge Function sends the push through APNs directly, or through Firebase Cloud Messaging if Firebase is added later.
5. The existing in-app notification center remains as a derived operational priority feed.

Because this is a private two-owner app, a small Supabase token table plus one Edge Function is enough later. A large notification platform is unnecessary unless delivery/reporting needs grow.

## What Was Implemented Now

Implemented safely:

- Installed `@react-native-community/push-notification-ios`.
- Ran `pod install`; `RNCPushNotificationIOS` is now linked in Pods.
- Added `src/services/pushTokenService.ts` for permission checks, permission requests, token registration, token upsert, token deactivation, and current-user token lookup.
- Added `supabase/migrations/20260529_create_user_push_tokens.sql`.
- Extended typed push notification payload/event types.
- Added notification service functions for future push events:
  - `notifyNewOrderCreated`
  - `notifyOrderReadyToPack`
  - `notifyPackingTaskCreated`
  - `notifyLowStock`
  - `notifyPackagingMaterialLow`
  - `notifyUnpaidOrderReminder`
  - `notifyTaskWaiting`
- Settings UI now lets the user request iOS notification permission and attempts to save the token when native registration returns one.
- Existing in-app notification center remains unchanged.

Not implemented:

- APNs push sending
- Supabase Edge Function sender
- Apple Developer credential configuration
- Xcode Push Notifications capability
- AppDelegate Swift bridge methods for the `register` / `registrationError` events

## Token Storage Migration

Migration added:

- `supabase/migrations/20260529_create_user_push_tokens.sql`

It creates:

- `public.user_push_tokens`
- RLS policies so users can only manage their own tokens
- Unique constraint on `(user_id, token)`
- `updated_at` trigger

Apply it before expecting token save to succeed.

## Native Dependency

Chosen dependency:

- `@react-native-community/push-notification-ios`

Why:

- The app is bare React Native, not Expo.
- The requested scope is iOS-first APNs token registration.
- Firebase would introduce a larger FCM setup that is not currently needed.
- The package is focused on iOS permission/token/event handling.

Install state:

- npm dependency installed
- CocoaPods installed
- Xcode capabilities still required manually

## Native iOS Requirements

To make real push notifications work on iPhone:

- Apple Developer account
- App ID with Push Notifications capability
- APNs key or certificate
- Xcode Signing & Capabilities updated for Push Notifications
- Background Modes > Remote Notifications if background delivery is needed
- AppDelegate Swift integration for:
  - `didRegisterForRemoteNotificationsWithDeviceToken`
  - `didFailToRegisterForRemoteNotificationsWithError`
  - remote notification receive callbacks
- Real device testing; simulator push support is limited and not suitable for final acceptance

## Backend Requirements

Recommended Supabase Edge Function later:

- `supabase/functions/send-push-notification/index.ts`
- Environment secrets:
  - APNs key id
  - APNs team id
  - APNs private key
  - bundle id
  - Supabase service role key

The Edge Function should:

- Receive a typed notification event
- Look up enabled device tokens
- Send APNs notification
- Return delivery result
- Avoid exposing APNs credentials to the app

## Testing Plan

1. Apply `20260529_create_user_push_tokens.sql`.
2. Enable Push Notifications capability in Xcode.
3. Add AppDelegate Swift bridge methods required by `RNCPushNotificationIOS`.
4. Request permission on a real iPhone from Settings.
5. Confirm a token row is stored in `user_push_tokens`.
6. Deploy Edge Function with APNs secrets.
7. Create a test order from one owner account.
8. Verify the other owner receives a push.
9. Verify in-app notification center still shows derived alerts.

## Important Limitation

The current implementation is token-registration-ready after native Xcode/AppDelegate setup and the Supabase migration are applied. It does not claim real push delivery is working.
