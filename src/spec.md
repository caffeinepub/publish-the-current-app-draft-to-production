# Specification

## Summary
**Goal:** Enable proper Stripe card checkout from the cart, creating orders only after Stripe confirms successful payment, while restoring persistent Stripe admin settings and integrating token discount/earn logic.

**Planned changes:**
- Update the cart “Card Payment” option to create a Stripe Checkout Session via the backend and redirect the user to Stripe Checkout (instead of treating a local form submit as payment success).
- Add success/cancel (failure) return handling: on success, read the Stripe session id from the URL and call the backend to verify session status with Stripe; show a failure route/state for canceled/failed/unpaid verification results.
- Defer order persistence until after successful Stripe session verification; only then create/mark the order completed, clear the cart, and show success confirmation.
- Preserve buyer-entered details across the Stripe redirect so they can be used when creating the order after payment success.
- Restore backend persistence for Stripe settings (test key, live key, active mode) and ensure Admin > Payments loads current config, masks key display, and updates settings; prevent non-admin access to secret keys.
- Apply automatic token-based discounts when calculating the Stripe checkout amount, and award bonus/earned tokens only after payment success verification and order creation; refresh token balance/history on the success page.

**User-visible outcome:** Shoppers can choose “Card Payment” in the cart, complete payment on Stripe, and only see an order created/confirmed after Stripe reports success; admins can view and update Stripe Test/Live keys and active mode, and token discounts/earnings correctly apply only after successful payment.
