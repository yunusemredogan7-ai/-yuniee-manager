# Reliability Plan

This pass improves day-to-day reliability for two-owner usage without changing schema, calculations, or core business rules.

## Implemented

- Added subtle sync/freshness indicators through `SyncStatus`.
- Added pull-to-refresh or manual refresh paths on core operational screens.
- Added clearer retry/error states where practical.
- Added stronger duplicate-submit guards on high-risk actions:
  - order creation
  - order status updates
  - packing task creation
  - task create/edit/delete
  - expense creation/delete
  - packaging material save/delete
  - product recipe save/delete
- Added shared `ConfirmDialog` usage for important destructive actions where it was safe to migrate.
- Preserved existing Supabase realtime subscriptions on screens that already use them.

## Realtime Status

Existing realtime channels remain in place for:

- Dashboard-related tables
- Orders
- Tasks
- Product/stock changes
- Expenses
- Sales history
- Stock movements
- Packaging materials where existing fetch logic supports it

This pass does not introduce a new realtime abstraction or offline mutation queue.

## Pull-To-Refresh Coverage

Pull-to-refresh or manual refresh now exists for:

- Dashboard
- Orders
- Stock
- To Do
- Expenses
- Product Management
- Packaging Materials
- Sales History
- Stock Movements
- Product Recipes

## Duplicate Submission Protection

The UI disables or guards actions while the app is saving/updating. This is local UI protection only. It prevents common double taps but is not a backend lock.

## Still Recommended Later

- True offline read cache
- Offline mutation queue with conflict handling
- Backend idempotency for order creation and stock movement creation
- A central realtime/sync service if the app grows
- Server-side audit tables for critical actions

## No Schema Changes

No database schema changes were made for this reliability pass.
