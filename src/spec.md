# Specification

## Summary
**Goal:** Remove all AI assistance/guidance UI from OC Club and remove the “Work with us” entry point from the Community page.

**Planned changes:**
- Remove the global AI chat tutor UI so it is not rendered or accessible anywhere (including the floating chat button/widget) and ensure no routes/pages render AI tutor components.
- Remove AI assistance/guidance UI from the learning/tutorial experience (AI feedback/guidance panels and any enable/disable controls) and update any Learning-area copy that advertises AI guidance to non-AI English wording.
- Remove the “Work with us” button from the Community page and remove any related dialog wiring so it cannot be opened from Community, while keeping existing Community post/recording functionality unchanged.

**User-visible outcome:** The app has no AI chat tutor or AI guidance controls/panels anywhere, and the Community page no longer shows (or can open) the “Work with us” dialog.
