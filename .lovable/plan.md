

# Unified Login Page for Admin & Driver

## Overview
Merge the two separate login pages (`/admin/login` and `/driver/login`) into a single `/login` page. After login, the system checks the user's role via `has_role()` and redirects to the appropriate dashboard (`/admin` or `/driver`).

## Changes

### 1. Create Unified Login Page (`src/pages/Login.tsx`)
- Single email/password login form with signup option (for drivers)
- On successful login, check roles via `has_role()`:
  - Admin role → redirect to `/admin`
  - Driver role → redirect to `/driver`
  - Neither → show error "Akun tidak memiliki akses"
- Signup flow remains the same as current driver signup (name, phone, email, password)
- Clean mobile-friendly UI with SEAT-GO branding

### 2. Update Routes in `App.tsx`
- Add `/login` route pointing to new unified Login page
- Remove `/admin/login` and `/driver/login` routes
- Keep both as redirects to `/login` for backward compatibility

### 3. Update Protected Route Redirects
- `ProtectedAdminRoute.tsx`: redirect to `/login` instead of `/admin/login`
- `ProtectedDriverRoute.tsx`: redirect to `/login` instead of `/driver/login`

### 4. Delete Old Login Pages
- Remove `src/pages/admin/AdminLogin.tsx`
- Remove `src/pages/driver/DriverLogin.tsx`

## Files
- **New**: `src/pages/Login.tsx`
- **Modified**: `src/App.tsx`, `src/components/admin/ProtectedAdminRoute.tsx`, `src/components/driver/ProtectedDriverRoute.tsx`
- **Deleted**: `src/pages/admin/AdminLogin.tsx`, `src/pages/driver/DriverLogin.tsx`

## Technical Details
- Role detection happens server-side via `has_role()` RPC after authentication
- Signup still links new users to existing driver records by phone match
- No database changes needed

