# Yuniee Manager Admin Runbook

This runbook explains how the YUNIEE owner/admin team should use Yuniee Manager in daily operations.

Yuniee Manager is a private internal app. It is not a customer-facing app. It is intended for the two owner/admin users who manage orders, stock, packaging costs, finance, expenses, and internal tasks.

## Daily Usage Flow

A practical daily flow:

1. **Open Dashboard**
   - Check today/week/month metrics.
   - Look for low-stock warnings.
   - Review recent orders and top products.

2. **Review Orders**
   - Add new customer orders as they come in.
   - Check recent order status.
   - Only mark an order as Delivered when it is truly ready to deduct stock.

3. **Check Stock**
   - Review low-stock products.
   - Add production entries when new items are produced.
   - Use manual stock adjustment only when correcting known stock differences.

4. **Maintain Packaging Rules**
   - Update packaging materials if real material costs change.
   - Update product packaging rules only when the business packaging logic changes.

5. **Update Expenses**
   - Record business overhead and operating costs.
   - Keep categories consistent so finance totals stay useful.

6. **Use To Do**
   - Capture new ideas and tasks.
   - Move active work into In Progress.
   - Keep Waiting tasks updated with a waiting reason.
   - Move completed work to Done.

## Orders Workflow

Use Orders for real customer orders.

Recommended process:

1. Enter customer name.
2. Add phone/address if useful.
3. Select product.
4. Select size when the product uses size.
5. For Bag products, do not use apparel sizes.
6. Set quantity.
7. Add item to cart.
8. Add additional items if needed.
9. Select source.
10. Add a note only if it helps fulfillment.
11. Review subtotal.
12. Create order.

Important:

- Multi-item orders are supported.
- Packaging cost is calculated when the order is saved.
- The order card shows the total packaging cost, not item-by-item packaging details.
- Recent orders should be used to check what was just entered.

## Delivered Status

Use Delivered carefully.

Delivered is a high-impact action because it is connected to stock deduction.

Before marking an order as Delivered:

- Confirm the order is actually completed.
- Confirm the items and quantities are correct.
- Confirm the stock looks reasonable.
- Do not use Delivered as a temporary status.

If delivery fails because of stock:

- Review the stock level for the product and size.
- Check whether production was recorded.
- Check whether a manual adjustment is needed.
- Do not repeatedly force the same action without understanding the stock issue.

## Stock Workflow

Use Stock to monitor inventory and operational readiness.

Recommended use:

- Review total units and low-stock products.
- Use Product Management to create or update products.
- Use production entries when new stock is produced.
- Use manual adjustment for corrections only.

Manual adjustment should be used carefully:

- Use positive values to increase stock.
- Use negative values to reduce stock.
- Only adjust when you know the real reason.
- Do not use adjustment as a substitute for delivered order flow.

## Product Management

Products should be kept clean and consistent.

Each product should have:

- Name
- Product type
- Color
- Cost
- Price

Current product types:

- T-shirt
- Hoodie
- Sweat
- Bag

Notes:

- Color does not affect packaging rules.
- Size does not affect packaging rules.
- Bag is treated as a no-size product for ordering.
- Do not create duplicate products with slightly different names unless they are truly different products.

## Packaging / Cost Workflow

Packaging cost is automatic, but the inputs must be maintained correctly.

### Packaging Materials

Use Packaging Materials to maintain real packaging supply costs.

Examples:

- Box
- Bag
- Sticker
- Paper
- Tape

Keep unit cost accurate when material prices change.

### Product Recipes / Packaging Rules

Use Product Recipes to define packaging rules by product type.

Current rule direction:

- Rules are product-type based.
- Rules are not color-based.
- Rules are not size-based.
- Mixed orders are calculated item by item and summed.

Change packaging rules carefully:

- A rule change can affect future packaging cost calculations.
- Check a few real order examples after changing rules.
- Do not change rules casually during busy order entry.

## Finance / Expenses Workflow

Finance should be used as an operational overview, not as a formal accounting system unless verified separately.

Use Finance Overview to check:

- Revenue
- Expenses
- Profit
- Sales history
- Cost management areas

Use Sales History to review:

- Delivered order history
- Revenue
- Profit

Use Expenses to record business overhead and operating costs, such as:

- Rent
- Electricity
- Water
- Internet
- Shipping
- Fabric
- Printing
- Packaging
- Ads
- General
- Other

Before trusting finance numbers:

- Confirm delivered orders are correctly marked.
- Confirm product cost values are accurate.
- Confirm packaging material costs and rules are current.
- Confirm expenses have been entered consistently.

## To Do Workflow

Use To Do as an internal operational Kanban board.

Lanes:

- **Ideas**: possible tasks or future improvements.
- **To Do**: tasks that should be done but are not active yet.
- **In Progress**: active work. Keep this limited.
- **Waiting**: blocked tasks that depend on something else.
- **Done**: completed tasks.

Recommended use:

- Add short, clear task titles.
- Use notes for extra context.
- Add due dates when timing matters.
- Add waiting reason when moving a task to Waiting.
- Keep In Progress focused.
- Move tasks to Done when completed.

Avoid:

- Putting too many tasks in In Progress.
- Leaving Waiting tasks without a reason.
- Using To Do as a replacement for order records or stock records.

## Common Mistakes to Avoid

- Marking an order Delivered before it is truly complete.
- Using manual stock adjustment instead of the delivered flow.
- Creating duplicate products with inconsistent names.
- Changing packaging rules without checking real examples.
- Forgetting to update product cost after supplier/cost changes.
- Entering expenses under random categories.
- Trusting profit numbers before product costs, packaging costs, and expenses are current.
- Treating Bag products like sized apparel.

## Safe Admin Rules

- Make one important change at a time.
- Check the result after changing product, stock, or packaging data.
- Keep product names consistent.
- Keep product costs and prices current.
- Only adjust stock when there is a known reason.
- Treat Delivered as final operational action.
- Review Dashboard after major order or stock updates.

## When to Recheck Data

Recheck data when:

- Stock does not match physical inventory.
- Delivered order fails.
- Profit looks unexpectedly high or low.
- Packaging cost looks wrong.
- A product was edited recently.
- A packaging rule was changed.
- Expenses look incomplete.
- Turkish/English display seems mixed after switching language.
- Dark mode or light mode makes a screen hard to read.

## If Data Looks Wrong

Use this order:

1. Check whether the order was entered correctly.
2. Check whether the order status is correct.
3. Check whether the product cost and price are correct.
4. Check stock for the product and size.
5. Check packaging materials and product recipes.
6. Check expenses if profit is the concern.
7. Avoid making multiple corrections at once.

If the issue still does not make sense, document:

- Order ID
- Product name
- Size if applicable
- Quantity
- Current stock
- Expected stock
- What action was taken

Then review before making further changes.

## Notes

- This app is designed for private owner/admin operations.
- It should stay simple, calm, and reliable.
- Use it as the daily source of operational truth, but verify numbers when business-critical decisions depend on them.
- Future changes should protect the working Orders, Delivered, Stock, Packaging, Finance, and To Do flows.
