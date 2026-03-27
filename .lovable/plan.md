

# Review & Improve Driver Registration Flow

## Current Issues

1. **Onboarding page unprotected** — `/driver/onboarding` has no auth guard; anyone can access it
2. **Pending review screen is bare** — shows "Akun Dalam Review" but no data completeness status (KTP, SIM, photo checkmarks)
3. **No post-verification redirect logic** — after clicking email verification link, user lands on `/` instead of being routed to onboarding
4. **No "verified" status indicator** — after admin approves, driver just enters the app without a welcome/verified confirmation

## Changes

### 1. Protect Onboarding Route (`src/App.tsx`)
Wrap `/driver/onboarding` with a lightweight auth check (must be logged in + have driver role). Redirect to `/login` if unauthenticated.

### 2. Handle Post-Email-Verification Redirect (`src/App.tsx` + `src/pages/Login.tsx`)
- The `emailRedirectTo` is set to `window.location.origin` (lands on `/`)
- Change it to `window.location.origin + "/driver"` so after verification the driver hits `ProtectedDriverRoute`, which auto-redirects to onboarding if data is incomplete

### 3. Enhance Pending Review Screen (`src/components/driver/ProtectedDriverRoute.tsx`)
Replace the simple "Akun Dalam Review" screen with a detailed status card showing:
- Name & phone (from driver record)
- KTP upload status (checkmark or missing)
- SIM upload status (checkmark or missing)  
- Photo upload status (checkmark or missing)
- Overall status badge: "Menunggu Review Admin"
- Button to go back to onboarding if any document is missing (edge case)
- Logout button

### 4. Add Welcome/Verified Screen on First Approved Login (`src/components/driver/ProtectedDriverRoute.tsx`)
When driver is `approved` and it's their first time seeing it:
- Show a brief "Akun Terverifikasi" welcome animation (auto-dismiss after 2 seconds or tap to continue)
- Use `localStorage` flag `sg_driver_welcomed` to only show once
- Then render children (driver dashboard)

### 5. Protect Onboarding with Auth Guard (`src/pages/driver/DriverOnboarding.tsx`)
Add auth check at top: if no user or not a driver role, redirect to `/login`.

## Files
- `src/App.tsx` — wrap onboarding route with auth guard
- `src/pages/Login.tsx` — update `emailRedirectTo` to `/driver`
- `src/components/driver/ProtectedDriverRoute.tsx` — enhanced pending screen with checklist + verified welcome
- `src/pages/driver/DriverOnboarding.tsx` — add auth redirect if not logged in

No database changes needed.

