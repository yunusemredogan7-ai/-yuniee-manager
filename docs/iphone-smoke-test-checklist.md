# iPhone Smoke Test Checklist

Use this checklist before trusting Yuniee Manager for daily real-device usage. This is a runtime smoke test, not a full release certification.

## Before Testing

- [ ] Run `npm install` if dependencies are not installed.
- [ ] Run `cd ios && pod install` after dependency changes or on a fresh machine.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Open `ios/yunieeManager.xcworkspace` in Xcode.
- [ ] Select a real iPhone as the run target.
- [ ] Confirm Signing & Capabilities are valid for the selected Apple Developer team.
- [ ] Confirm the app bundle identifier is acceptable for real-device testing.
- [ ] Confirm Supabase credentials in `src/core/supabase/client.ts` point to the intended project.
- [ ] Confirm required Supabase migrations have been applied, especially `supabase/migrations/20260529_create_user_push_tokens.sql` if testing push token storage.

## App Launch

- [ ] App opens without crashing.
- [ ] Login screen appears when signed out.
- [ ] User can log in with a real owner/admin account.
- [ ] Bottom tabs are visible after login.
- [ ] Bottom tabs open Dashboard, Orders, To Do, Stock, and Finance.
- [ ] Settings opens from the header gear.

## Dashboard

- [ ] Dashboard loads data without a permanent loading state.
- [ ] Notification center appears correctly.
- [ ] No Quick Actions section is visible.
- [ ] Pull-to-refresh works.
- [ ] Low stock, pending task, unpaid order, and cost warnings appear only when relevant.
- [ ] Empty states look calm if no data exists.

## Orders

- [ ] Order list loads.
- [ ] Search/filter controls behave normally.
- [ ] Create order flow works.
- [ ] Multi-item cart displays clearly.
- [ ] Packaging cost appears correctly before submit.
- [ ] Stock availability warning appears where relevant.
- [ ] Status update works.
- [ ] Delivered/completed action remains intentional.
- [ ] Cancel order asks for confirmation.
- [ ] Packing task creation works.
- [ ] Recent/order cards remain readable.

## To Do / Kanban

- [ ] To Do opens directly with compact layout.
- [ ] No SPACE section is visible.
- [ ] No Search tasks input is visible.
- [ ] No Synced row is visible.
- [ ] No Refresh button is visible.
- [ ] Quick add appears near the top and works.
- [ ] New task modal opens and saves.
- [ ] Task edit works.
- [ ] Task move works between IDEAS, TO DO, IN PROGRESS, WAITING, and DONE!.
- [ ] WAITING reason behavior works.
- [ ] Due date save/load works.
- [ ] Delete task asks for confirmation.
- [ ] WIP limit for IN PROGRESS is enforced.
- [ ] Colored cards look correct in light mode.
- [ ] Colored cards look correct in dark mode.

## Stock

- [ ] Stock list loads.
- [ ] No Search product/type input is visible.
- [ ] Low stock filter/warnings work.
- [ ] Bag products do not display apparel size chips.
- [ ] Product Management opens from Stock.
- [ ] Stock Movements opens from Stock.
- [ ] Add stock movement works.
- [ ] Pull-to-refresh works where available.

## Finance / Admin

- [ ] Finance Overview opens.
- [ ] Expenses opens, lists data, and add/delete flows work.
- [ ] Product Management opens and add/edit flows work.
- [ ] Packaging Materials opens.
- [ ] No Search materials input is visible.
- [ ] Packaging material add/edit/delete flows work.
- [ ] Product Recipes opens and add/edit/delete flows work.
- [ ] Sales History opens and filters/search behave normally.
- [ ] Stock Movements opens and filters/search behave normally.
- [ ] Money values, cost values, profit, and totals remain readable.

## Settings

- [ ] Settings opens from the header gear.
- [ ] Theme setting works.
- [ ] Dark mode applies across main screens.
- [ ] Language setting works.
- [ ] Push Notification Settings appears.
- [ ] Requesting notification permission does not crash.
- [ ] If native/APNs setup is incomplete, push settings show a safe unavailable/error status.
- [ ] If permission is denied, the UI explains how to re-enable it from iOS Settings.

## Sync / Reliability

- [ ] Pull-to-refresh works where implemented.
- [ ] SyncStatus appears only where intended.
- [ ] Realtime updates appear where existing subscriptions are configured.
- [ ] Duplicate submit guards prevent rapid double-created records.
- [ ] Error states appear calmly and include retry where implemented.
- [ ] ConfirmDialog appears for destructive actions.

## Known Limitations

- Real push sending is not implemented yet.
- Push token registration must be tested on a real iPhone, not only simulator.
- Simulator may not provide a real APNs device token.
- Push token storage requires the `user_push_tokens` migration to be applied in Supabase.
- Apple Developer account setup, Push Notifications capability, and signing must be completed in Xcode.
- The current native iOS app delegate may still need APNs registration/delegate forwarding before token registration succeeds reliably.
- Real push delivery later requires a backend sender such as a Supabase Edge Function plus APNs credentials or another push provider.
- Realtime behavior depends on existing Supabase subscriptions and project realtime settings.

## Pass Criteria

- [ ] App launches on a real iPhone.
- [ ] Login works.
- [ ] All main tabs and nested screens open.
- [ ] Core operational flows work without crashes.
- [ ] Removed UI sections remain removed.
- [ ] Dark/light mode are readable.
- [ ] Push settings are safe even if real push delivery is not ready.
- [ ] No TypeScript or lint failures remain.
