# Specification

## Summary
**Goal:** Rename the public-facing app/webpage name to **3Docarinas** across all visible UI text and the browser title.

**Planned changes:**
- Update the HTML document title in `frontend/index.html` to "3Docarinas".
- Replace navbar/site name fallback text in `frontend/src/components/Layout.tsx` with "3Docarinas" when no `branding.siteName` is set.
- Update loading screen copy in `frontend/src/components/LoadingScreen.tsx` to "Loading 3Docarinas...".
- Spot-check and replace any remaining public-page visible references to the old ocarina-branded app name (header, footer, homepage hero area).

**User-visible outcome:** The public webpage consistently displays the app name as **3Docarinas** (including the browser tab title and loading screen), with no remaining "Ocarina" name references.
