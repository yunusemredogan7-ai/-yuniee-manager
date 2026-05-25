# Yuniee Manager

Yuniee Manager is a private mobile admin app for YUNIEE. It is built for owner/admin use only and is currently intended for a very small internal team of two people.

This is not a customer-facing shopping app. It is an operational tool for managing daily business work such as orders, inventory, packaging costs, finance, expenses, and internal tasks.

## Project Overview

The app centralizes YUNIEE's owner/admin workflows into one React Native application. It connects to Supabase for authentication, data storage, order records, stock data, finance-related tables, packaging materials, packaging rules, and task persistence.

The product direction is practical and restrained: a calm, premium, mobile-first admin app for daily operational use.

## Purpose

Yuniee Manager helps the business owner/admin team:

- Create and manage customer orders
- Track delivered orders and sales history
- Manage stock and product data
- Maintain packaging materials and product packaging rules
- Monitor revenue, profit, expenses, and operating costs
- Organize internal work with a Kanban-style To Do board
- Configure local app preferences such as theme and language

## Main Features

- **Dashboard**: overview of orders, revenue, profit, stock alerts, top products, and recent orders.
- **Orders**: multi-item order creation, customer info, source tracking, packaging cost display, and order status management.
- **Stock**: product stock overview, low-stock visibility, stock movement history, and product management access.
- **Product Management**: product structure including name, product type, color, cost, price, and stock-related actions.
- **Packaging Materials**: editable packaging material list with unit types and unit costs.
- **Product Recipes / Packaging Rules**: editable product-type-based packaging rules used for packaging cost calculation.
- **Finance Overview**: high-level revenue, expense, profit, and cost management navigation.
- **Sales History**: delivered order and sales trail with revenue and profit visibility.
- **Expenses**: business overhead and operating cost tracking.
- **To Do / Kanban**: internal task board with lanes, due dates, waiting reasons, notes, WIP limit, and persistence.
- **Settings**: light/dark theme, English/Turkish language preference, and notification-related preferences.

## Tech Stack

- **React Native** `0.84.1`
- **React** `19.2.3`
- **TypeScript**
- **React Navigation**
  - Bottom tabs
  - Native stack navigation
- **Supabase JS** for backend access
- **AsyncStorage** for local app preferences
- **React Native Vector Icons**
- **ESLint / Prettier / Jest**
- **iOS and Android native projects** included through the standard React Native CLI setup

## Project Structure

```text
.
├── App.tsx
├── screens/
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── ToDo.tsx
│   ├── Stock.tsx
│   ├── ProductManagement.tsx
│   ├── FinanceOverview.tsx
│   ├── SalesHistory.tsx
│   ├── Expenses.tsx
│   ├── PackagingMaterials.tsx
│   ├── ProductRecipes.tsx
│   └── Settings.tsx
├── src/
│   ├── core/
│   │   ├── settings/
│   │   └── supabase/
│   ├── services/
│   └── components/
├── supabase/
│   └── migrations/
├── ios/
├── android/
└── package.json
```

## Local Development

Install dependencies:

```sh
npm install
```

Start Metro:

```sh
npm start
```

Run on iOS:

```sh
npm run ios
```

Run on Android:

```sh
npm run android
```

Run TypeScript checks:

```sh
npx tsc --noEmit
```

Run ESLint:

```sh
npm run lint
```

Run tests:

```sh
npm test
```

For iOS, CocoaPods may need to be installed or refreshed after dependency changes:

```sh
cd ios
bundle install
bundle exec pod install
```

## Supabase / Database Notes

Yuniee Manager depends on Supabase for its live backend data. The app uses Supabase for core operational tables such as orders, order items, products, stock, stock movements, sales, expenses, packaging materials, product packaging rules, and tasks.

Local generated database types live under:

```text
src/core/supabase/database.types.ts
```

Database migration artifacts live under:

```text
supabase/migrations/
```

Before working on database-dependent features, make sure the local generated types, app assumptions, and live Supabase schema are aligned.

## Current Status

The app is in a near-final internal productization stage. The main owner/admin workflows are implemented and have been polished for daily use:

- Orders and delivered flow
- Stock and product management
- Packaging materials and packaging rules
- Finance, sales history, and expenses
- Kanban To Do
- Theme and language preferences
- Settings access

Further work should prioritize careful verification, schema-safe changes, and small operational improvements rather than broad redesigns.

## Notes

- This app is private and intended only for YUNIEE owner/admin usage.
- It should not be treated as a public customer app.
- Do not add schema changes without creating or updating the relevant SQL migration artifact.
- Do not assume local generated types match the live Supabase schema without verification.
- Keep changes conservative because the app supports real operational workflows.
