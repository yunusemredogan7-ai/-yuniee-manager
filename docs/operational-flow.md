# Yuniee Manager Operational Flow

This document describes the current owner/admin workflow implemented in the app. It is based on existing app data only; no new database tables were added for this pass.

## Daily Command Center

The Dashboard now acts as the daily starting point. It summarizes:

- Active orders that still need follow-up
- Orders that are ready to pack
- Low stock products
- Waiting or overdue shared tasks
- Products with missing cost values

These alerts are derived from existing orders, stock, products, and To Do data.

## Orders Workflow

Orders still use the existing stored statuses:

- `Preparing`
- `Ready`
- `Shipped`
- `Delivered`
- `Cancelled`

The UI maps those statuses into a clearer visual flow:

- New
- In production
- Ready to pack
- Packed
- Delivered
- Cancelled

The visual labels do not change the stored database values.

## Packing Workflow

When an order reaches `Ready`, the order card highlights that it is ready to pack.

The owner can create a shared YUNIEE To Do task for packing. The task includes:

- Order number
- Customer name
- Product summary
- Sales source
- Payment tracking note

Payment status is not currently stored in the schema, so the app does not infer unpaid orders.

## Stock Awareness

During order creation, the selected product/size shows available stock when stock data exists. The UI warns if the current order quantity may leave stock low or negative.

This is only a visibility improvement. Stock deduction logic remains unchanged.

## To Do Ownership

To Do spaces remain:

- YUNIEE shared
- IREM private
- YEMRE private

Packing tasks are created in the shared YUNIEE space so both owners can see them.

## Confirmations

Important actions now use clearer confirmation copy where practical:

- Cancel order
- Mark delivered
- Delete task
- Delete expense
- Delete packaging material
- Delete product recipe

Other existing destructive confirmations remain in place.

## Sync And Freshness

Main operational screens now show subtle sync/freshness indicators or refresh controls. Two owners should use pull-to-refresh if a screen looks stale, while existing realtime subscriptions continue updating key lists in the background.
