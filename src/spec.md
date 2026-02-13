# Specification

## Summary
**Goal:** Simplify the Store page header UI and ensure store products and Stripe checkout remain available after canister upgrades.

**Planned changes:**
- Remove the Store page’s top header/banner section so the first selected element no longer renders.
- Update backend product storage to persist uploaded products across canister redeploy/upgrade so existing items still appear.
- Persist existing Stripe configuration across upgrades so Stripe checkout continues to work without reconfiguration.

**User-visible outcome:** The Store page no longer shows the top banner/header, previously uploaded products still appear after upgrades, and users can continue completing Stripe checkout with the existing Stripe setup (or see the existing “not configured” error state when applicable).
