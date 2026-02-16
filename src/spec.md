# Specification

## Summary
**Goal:** Restore and persist admin Stripe payment settings (test/live keys and active mode) so checkout automatically uses the configured mode and key.

**Planned changes:**
- Restore the Admin > Payments > Payment Settings UI to show Stripe Test Secret Key, Stripe Live Secret Key, a Test/Live mode toggle, and a Save/Update action with English validation and saving states.
- Add backend canister persistence for Stripe settings (test key, live key, active mode, and any existing fields such as allowed countries), with stable storage across upgrades.
- Enforce admin-only access: only admins can update settings and only admins can read secret key material back.
- Update Stripe session/checkout creation to automatically use the active mode’s secret key; treat card checkout as unavailable when the active mode is not configured (token checkout unchanged).
- Add/adjust React Query hooks and frontend types to load current settings, save updates, and invalidate/refresh relevant queries after saving.
- If the persisted Stripe configuration shape changed, add a safe backend migration to map prior configuration into the new structure without breaking existing stored data.

**User-visible outcome:** Admins can configure Stripe payment settings (test/live keys and active mode) from the Payments tab and save them; card checkout availability and Stripe session creation reflect the active mode’s configuration automatically.
