# Yuniee Manager Project Backlog

This backlog captures the practical post-v1 roadmap for Yuniee Manager. It is focused on real owner/admin usage after the current stabilization and productization work.

## What Is Already Solid

The following areas are implemented and should be treated as core working flows:

- **Orders**
  - Multi-item order creation
  - Customer details
  - Order source persistence
  - Recent orders
  - Status updates
  - Delivered flow
  - Stock deduction through the delivered flow
  - Packaging cost shown at order level

- **Dashboard**
  - Key metrics
  - Low-stock visibility
  - Top products
  - Recent order visibility

- **To Do / Kanban**
  - Five-lane board: Ideas, To Do, In Progress, Waiting, Done
  - Create, edit, move, delete
  - Due dates
  - Waiting reason
  - Notes
  - WIP limit for In Progress
  - Persistent tasks

- **Stock and Product Management**
  - Stock overview
  - Product creation/editing
  - Product type, color, cost, and price
  - Stock movements
  - Production and manual adjustment flows

- **Finance**
  - Finance overview
  - Sales history
  - Expense / business overhead tracking
  - Profit visibility

- **Packaging System**
  - Editable packaging materials
  - Editable product-type-based packaging rules
  - Packaging cost calculation aligned with orders

- **Settings**
  - Light / dark theme
  - English / Turkish language switching
  - Local preference persistence

## What Should Be Monitored During Real Usage

Use the first real operating period to watch for practical issues in daily workflows:

- Whether order creation is fast enough for repeated daily use
- Whether recent orders show the right amount of history
- Whether delivered/status actions feel clear and safe
- Whether Bag no-size ordering behaves correctly with real products
- Whether packaging rule calculations match owner expectations
- Whether finance totals and sales profit feel trustworthy after real orders
- Whether Turkish/English labels still have any small missed strings
- Whether dark mode remains readable in all real usage contexts
- Whether To Do lane navigation and top lane pills feel comfortable after repeated use

## What Should Be Improved Next

These are the safest next polish targets after manual acceptance:

1. **Order UX Refinement**
   - Review order creation after several real orders.
   - Decide whether product selection needs search improvements, grouping, or faster repeat-item entry.
   - Keep the current flow unless real use proves friction.

2. **Bag Product Naming**
   - Add a clearer model/type naming approach for Bag products later.
   - Do not force bags into apparel size logic.
   - Keep this separate from the current product type system until the owner defines the naming model.

3. **Packaging Rule Review**
   - Validate packaging material usage and product-type rules with real examples.
   - Consider deeper flexibility only if the current product-type rules become limiting.

4. **Manual Acceptance Polish**
   - Collect final owner/admin findings from real device testing.
   - Fix only specific issues found in actual use.
   - Avoid broad redesign unless a workflow is clearly painful.

## Technical Follow-ups

These items are not urgent feature work, but they will help keep the project stable:

- Re-check Supabase schema alignment before any database-related changes.
- Keep generated Supabase types aligned with the live schema.
- Keep migrations under `supabase/migrations/` for every schema change.
- Review remaining test/helper scripts in the repo and decide whether to keep, document, or remove them.
- Consider adding a small smoke-test checklist for core flows:
  - Login
  - Create order
  - Deliver order
  - Stock deduction
  - Packaging cost
  - Expense entry
  - To Do task lifecycle
  - Theme/language switching
- Add lightweight error reporting or logging only if real usage reveals hard-to-debug failures.
- Keep UI constants and shared styling organized if future screens are added.

## Remaining Polish Items

These are small visual or copy refinements that can be handled after final manual control:

- Fine-tune any remaining typography inconsistencies found on real devices.
- Review long Turkish labels on small screens.
- Check all empty states with real data and no-data states.
- Verify modal spacing on smaller iPhones.
- Review dark mode contrast after nighttime usage.
- Confirm final wording for business overhead categories.

## Future Ideas

These are later-stage ideas and should not block v1 usage:

- **Notifications / Reminders**
  - Add true local notification delivery for To Do reminders when native setup is ready.
  - Keep reminder behavior honest and tested before calling it complete.

- **Release / TestFlight Readiness**
  - Prepare app icons, signing, build configuration, and TestFlight distribution when the owner is ready.
  - Create a release checklist before external device testing.

- **Deeper Packaging Logic**
  - Add more advanced packaging conditions only if real orders require them.
  - Keep product-type-based rules as the default stable model for now.

- **Analytics / Operational Logging**
  - Add lightweight logging only if needed for debugging real operations.
  - Avoid unnecessary analytics for a private two-person app.

- **Reporting**
  - Add period-based summaries or exports if finance review needs become more formal.

- **Role Handling**
  - Consider simple owner/admin role distinctions only if the two users need different access later.

## Nice-to-Have Items

These can wait until the app has been used in production-like daily work:

- More compact order history filters
- Optional product grouping by product type
- Quick repeat order actions
- Better stock threshold customization
- Simple monthly expense summaries
- Manual backup/export workflow
- More refined onboarding or help text for rarely used screens

## Backlog Rule

For this project, future work should stay conservative:

- Fix real issues found in use.
- Keep schema changes explicit and migrated.
- Avoid broad redesigns unless daily usage proves the need.
- Protect the working order, stock, finance, packaging, and To Do flows first.
