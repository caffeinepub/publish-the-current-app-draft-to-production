# Production Smoke Test Checklist

Use this checklist to verify critical functionality after deploying to production.

## Environment Setup

- [ ] Production URL loads successfully
- [ ] No console errors on initial page load
- [ ] App shell renders correctly (header, footer, main content area)

## Navigation & Routing

- [ ] Homepage (`/`) loads and displays hero section
- [ ] Learning page (`/learning`) loads and shows tutorials
- [ ] Community page (`/community`) loads and displays posts
- [ ] Store page (`/store`) loads and shows products
- [ ] Profile page (`/profile`) loads (when authenticated)
- [ ] Wallet page (`/wallet`) loads (when authenticated)
- [ ] Admin page (`/admin`) loads (for admin users only)
- [ ] Payment success page (`/payment-success`) loads
- [ ] Payment failure page (`/payment-failure`) loads

## Authentication Flow

- [ ] Login button is visible and clickable
- [ ] Login process completes successfully
- [ ] User profile setup modal appears for new users
- [ ] Profile setup can be completed with username and bio
- [ ] Logout button appears after successful login
- [ ] Logout clears user session and returns to guest view

## Critical User Flows

### Browse Content (Guest)
- [ ] Tutorials are visible on learning page
- [ ] Products are visible on store page
- [ ] Community posts are visible on community page
- [ ] Tutorial difficulty filters work
- [ ] Product images display correctly

### Authenticated User Actions
- [ ] Token balance displays in header
- [ ] Shopping cart icon shows item count
- [ ] Can add products to cart
- [ ] Cart drawer opens and displays items
- [ ] Can share recordings to community
- [ ] Can complete tutorials and receive rewards

### Admin Actions (Admin Only)
- [ ] Admin panel is accessible
- [ ] Can upload media files
- [ ] Can create tutorials
- [ ] Can create products
- [ ] Can configure Stripe settings

## Payment Integration

- [ ] Stripe configuration status is correct
- [ ] Can initiate checkout with Stripe (if configured)
- [ ] Payment success page displays after successful payment
- [ ] Payment failure page displays after cancelled payment
- [ ] Token balance updates after purchase

## AI Features

- [ ] AI chat tutor button is visible
- [ ] AI chat window opens and closes
- [ ] Can send messages to AI tutor
- [ ] AI assistant panel appears during tutorial playback (if enabled)

## Visual & UX

- [ ] Theme (light/dark mode) works correctly
- [ ] Responsive design works on mobile viewport
- [ ] Images and assets load properly
- [ ] Loading states display during async operations
- [ ] Error messages are clear and in English
- [ ] Toast notifications appear for user actions

## Performance

- [ ] Initial page load completes within 5 seconds
- [ ] Navigation between pages is smooth
- [ ] No memory leaks or performance degradation after extended use

## Post-Deployment Monitoring

- [ ] Check browser console for errors
- [ ] Verify backend canister is responding
- [ ] Monitor user reports for issues
- [ ] Confirm analytics/tracking is working (if applicable)

## Sign-Off

- **Tested by**: _______________
- **Date**: _______________
- **Production URL**: _______________
- **Issues found**: _______________

---

**Note**: If any checklist item fails, document the issue and determine if it requires immediate rollback or can be addressed in a hotfix.
