# Yuniee Manager Release / Readiness Checklist

Use this checklist before real daily usage, handoff, or future TestFlight-style preparation.

This checklist is practical and manual by design. It does not assume CI/CD, App Store release automation, or public deployment infrastructure.

## Pre-release Code Checks

- [ ] Install dependencies successfully with `npm install`.
- [ ] Start Metro successfully with `npm start`.
- [ ] Run TypeScript successfully:
  - [ ] `npx tsc --noEmit`
- [ ] Run ESLint successfully:
  - [ ] `npm run lint`
- [ ] Run tests if needed:
  - [ ] `npm test`
- [ ] Run the app on iOS Simulator or a real iPhone.
- [ ] Run the app on Android if Android usage is required.
- [ ] Confirm no obvious red screen/runtime errors on launch.
- [ ] Confirm no unfinished temporary UI/debug text is visible.

## Core Flow Checks

- [ ] Login works.
- [ ] Main tab navigation works.
- [ ] Settings is reachable from the header gear action.
- [ ] Dashboard loads data.
- [ ] Orders screen loads products/customers/recent orders.
- [ ] Stock screen loads products and stock data.
- [ ] Finance screen loads metrics and links.
- [ ] To Do board loads tasks.
- [ ] App remains usable after switching tabs.
- [ ] App remains usable after closing/reopening.

## Orders Checks

- [ ] Create a single-item order.
- [ ] Create a multi-item order.
- [ ] Select an existing customer.
- [ ] Create an order for a new customer.
- [ ] Add phone/address when needed.
- [ ] Select an order source.
- [ ] Add an order note.
- [ ] Confirm cart total is clear before submit.
- [ ] Confirm order appears in Recent Orders after creation.
- [ ] Confirm Recent Orders shows enough history for real usage.
- [ ] Confirm order status labels display correctly in English.
- [ ] Confirm order status labels display correctly in Turkish.
- [ ] Confirm Bag products do not show apparel size selection.
- [ ] Confirm Bag order items do not show fake size in cart or recent orders.
- [ ] Confirm apparel products still show XS/S/M/L/XL size selection.

## Delivered / Stock Checks

- [ ] Mark a valid order as Delivered.
- [ ] Confirm delivered flow completes successfully.
- [ ] Confirm stock is deducted after Delivered.
- [ ] Confirm Delivered should not be used as a temporary status.
- [ ] Try delivering an order with insufficient stock, if safe test data exists.
- [ ] Confirm insufficient stock is blocked or clearly reported.
- [ ] Confirm stock movement history reflects relevant stock changes.
- [ ] Confirm manual stock adjustment still works.
- [ ] Confirm production entry still works.

## Packaging Cost Checks

- [ ] Confirm packaging materials load.
- [ ] Add or edit a packaging material in test data.
- [ ] Confirm unit type and unit cost display clearly.
- [ ] Confirm product packaging rules load.
- [ ] Confirm rules are product-type based.
- [ ] Confirm color does not affect packaging rules.
- [ ] Confirm size does not affect packaging rules.
- [ ] Create a test order and confirm packaging cost appears on the order card.
- [ ] Create a mixed-item order and confirm packaging cost is still calculated and shown as one total.
- [ ] Confirm packaging cost is reflected in finance/sales profit expectations.

## Finance / Expenses Checks

- [ ] Finance Overview loads.
- [ ] Sales History loads delivered orders/sales.
- [ ] Sales History shows revenue and profit clearly.
- [ ] Expenses screen loads.
- [ ] Add a business overhead/operating cost.
- [ ] Confirm expense categories are appropriate:
  - [ ] Rent
  - [ ] Electricity
  - [ ] Water
  - [ ] Internet
  - [ ] Shipping
  - [ ] Fabric
  - [ ] Printing
  - [ ] Packaging
  - [ ] Ads
  - [ ] General
  - [ ] Other
- [ ] Delete an expense only with test data or when safe.
- [ ] Confirm total operating cost updates.
- [ ] Confirm profit numbers make sense after delivered orders and expenses.
- [ ] Confirm product cost values are current before trusting profit.

## To Do / Kanban Checks

- [ ] Create a task.
- [ ] Edit a task.
- [ ] Delete a task.
- [ ] Move a task between lanes.
- [ ] Confirm all lanes are reachable:
  - [ ] Ideas
  - [ ] To Do
  - [ ] In Progress
  - [ ] Waiting
  - [ ] Done
- [ ] Confirm lane taps go to the correct lane.
- [ ] Confirm `IN PROGRESS` label is not truncated.
- [ ] Confirm task updates appear immediately without tab switching.
- [ ] Add a due date and confirm it saves/loads.
- [ ] Move a task to Waiting and add a waiting reason.
- [ ] Confirm Done persists.
- [ ] Confirm WIP limit for In Progress still works.

## Theme / Language Checks

- [ ] Switch to Light mode.
- [ ] Confirm major screens remain readable.
- [ ] Switch to Dark mode.
- [ ] Confirm major screens do not remain white/light unexpectedly.
- [ ] Confirm inputs, cards, modals, headers, and tabs look correct in dark mode.
- [ ] Switch to English.
- [ ] Confirm main screens feel fully English.
- [ ] Switch to Turkish.
- [ ] Confirm main screens feel fully Turkish.
- [ ] Confirm navigation labels switch language.
- [ ] Confirm order status labels switch language.
- [ ] Confirm settings persist after app restart.

## Supabase / Migration Checks

- [ ] Confirm the app points to the intended Supabase project.
- [ ] Confirm Supabase authentication works.
- [ ] Confirm live schema matches app expectations before schema-related work.
- [ ] Confirm local generated types are aligned with the live schema when database changes are made.
- [ ] Confirm migration artifacts exist under `supabase/migrations/`.
- [ ] Confirm all required migrations have been applied to the current Supabase project.
- [ ] Confirm tasks table supports Kanban fields.
- [ ] Confirm products table supports product type and color.
- [ ] Confirm orders/source data is persisted.
- [ ] Confirm packaging materials and product packaging rules are available.
- [ ] Do not make manual database changes without documenting them in a migration.

## Operational Readiness Checks

- [ ] Owner/admin users understand this is not a customer-facing app.
- [ ] Owner/admin users know the daily usage flow.
- [ ] Owner/admin users understand Delivered affects stock.
- [ ] Owner/admin users understand manual stock adjustments should be used carefully.
- [ ] Owner/admin users know where to update product cost/price.
- [ ] Owner/admin users know where to update packaging materials/rules.
- [ ] Owner/admin users know where to record business overhead.
- [ ] Owner/admin users know how to use To Do lanes.
- [ ] Owner/admin users know what to check if data looks wrong.

## Documentation Checks

- [ ] `README.md` exists and describes the project.
- [ ] `ADMIN_RUNBOOK.md` exists and explains daily operational usage.
- [ ] `PROJECT_BACKLOG.md` exists and separates completed areas, follow-ups, and future ideas.
- [ ] `RELEASE_CHECKLIST.md` exists and is current.
- [ ] Supabase migrations are documented by filename under `supabase/migrations/`.
- [ ] Any future schema changes are reflected in docs or backlog as needed.

## GitHub / Repo Checks

- [ ] Repo has a clean, understandable project structure.
- [ ] No accidental secrets are committed.
- [ ] `.gitignore` is appropriate for React Native and local files.
- [ ] Unused temporary files are reviewed before handoff.
- [ ] Important documents are committed when ready.
- [ ] Commit messages clearly describe final stabilization changes.
- [ ] Do not commit generated or local-only files unless intentionally needed.

## Optional Future Release Checks

These are for later TestFlight-style or production-device preparation. They do not block internal manual use unless the owner/admin wants a formal release build.

- [ ] Confirm app icon and display name.
- [ ] Confirm iOS bundle identifier.
- [ ] Confirm Android package name if Android release is needed.
- [ ] Confirm signing configuration.
- [ ] Create a real-device smoke test checklist.
- [ ] Prepare TestFlight build only when Apple developer setup is ready.
- [ ] Verify notification permissions if true To Do reminders are implemented later.
- [ ] Add lightweight logging only if real usage requires debugging support.
- [ ] Consider a backup/export process if operational data review requires it.

## Final Go / No-Go

- [ ] Core flows pass.
- [ ] No critical data issues found.
- [ ] Supabase schema is aligned.
- [ ] Owner/admin users understand the runbook.
- [ ] Documentation is ready.
- [ ] Known deferred items are listed in `PROJECT_BACKLOG.md`.
- [ ] App is acceptable for real owner/admin use.
