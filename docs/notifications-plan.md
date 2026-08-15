# Notifications Plan

Yuniee Manager is now notification-ready, but real push notifications are not implemented yet.

## Implemented Now

The app includes a local notification architecture:

- `src/core/notifications/notificationTypes.ts`
- `src/services/notificationService.ts`
- `NotificationCenter` UI component

The current notification center is derived from existing data only.

It can surface:

- Orders ready to pack
- Active orders needing follow-up
- Low stock products
- Waiting tasks
- Overdue tasks
- Products with missing cost values

No notification database table was created.

## Not Implemented Yet

Real push sending is not configured yet. Device token registration foundation now exists; see `docs/push-notifications-plan.md` and `docs/ios-push-setup.md` for the native setup and backend sender path.

Missing pieces for real iOS push notifications may include:

- APNs setup through Apple Developer account
- Firebase Cloud Messaging or another push provider
- Native iOS notification permissions
- Device token registration
- A secure backend trigger path
- Optional Supabase Edge Functions for server-side notification events

Current project finding: this is a bare React Native app, not Expo. Firebase, Expo Notifications, APNs credentials, and Edge Functions are not configured. A `user_push_tokens` migration has been added, but it must be applied before token storage works.

## Future Notification Events

The notification event model is ready for:

- New order created
- Order ready to pack
- Low stock detected
- Packaging material low
- Unpaid order needs attention
- Task assigned or waiting

Payment-related notification events require a real stored payment status first.

## Recommended Later Architecture

For a production push setup, use:

- Supabase for source-of-truth data
- Supabase Edge Functions or a small backend job for event evaluation
- APNs or Firebase for push delivery
- Local in-app notification center for derived operational alerts

Until then, the app should treat the notification center as an in-app operational priority feed.
