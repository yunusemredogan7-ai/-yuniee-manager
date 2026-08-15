# iOS Push Setup

This document explains the native and backend steps needed after the app-side push token foundation.

## Native Dependency

Selected dependency:

```sh
npm install @react-native-community/push-notification-ios
cd ios
pod install
```

Both commands have been run in this workspace.

## Apple Developer Setup

Required:

- Apple Developer account
- App identifier for Yuniee Manager
- Push Notifications capability enabled for the App ID
- APNs Auth Key or certificate
- Real iPhone for final testing

## Xcode Setup

Open:

```sh
ios/yunieeManager.xcworkspace
```

In Signing & Capabilities:

- Add `Push Notifications`
- Add `Background Modes` if background remote notifications are needed
- Enable `Remote notifications` under Background Modes

## AppDelegate Setup Still Needed

The installed iOS package requires native AppDelegate callbacks for token registration events.

The current app uses `ios/yunieeManager/AppDelegate.swift`. Add Swift equivalents for:

- `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`
- `application(_:didFailToRegisterForRemoteNotificationsWithError:)`
- remote notification receive callback if foreground/background handling is needed

These callbacks must forward events to `RNCPushNotificationIOS`.

This was not modified automatically in this pass because Swift integration should be verified in Xcode with the installed Pod/module.

## Supabase Setup

Apply:

```sql
supabase/migrations/20260529_create_user_push_tokens.sql
```

This creates `public.user_push_tokens` with RLS so each authenticated user can manage only their own tokens.

## Testing On Real iPhone

1. Install the app on a real iPhone.
2. Log in as an owner/admin user.
3. Open Settings.
4. Tap the notification permission button.
5. Accept iOS notification permission.
6. Confirm `public.user_push_tokens` contains one active token for that user.

The iOS simulator is not reliable for APNs token registration and should not be used for final push acceptance.

## What Remains For Sending

The app can request/store tokens after native setup and migration are complete.

Actual push sending still requires:

- Supabase Edge Function or another backend sender
- APNs credentials stored as backend secrets
- Server-side lookup of recipient tokens
- Event trigger logic for order/task/stock events

Do not send APNs directly from the mobile app.
