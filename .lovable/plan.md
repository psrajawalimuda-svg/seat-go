

# Restore RBAC Redirect for Driver & Admin

## Problem
After login, all users navigate to `/dashboard` (passenger page). Admins and drivers are not redirected to their respective dashboards (`/admin`, `/driver`). The role detection via `user_roles` table works correctly, but the login flow doesn't use it for routing.

## Changes

### 1. Smart Redirect After Login (`src/pages/Login.tsx`)
After successful `signInWithPassword`, call `get_user_login_info` RPC to determine role, then redirect accordingly:
- `is_admin` → navigate to `/admin`
- `is_driver` → navigate to `/driver`
- Otherwise → navigate to `/dashboard`

This adds one RPC call but ensures correct routing. The call runs in parallel with AuthContext's own fetch, so there's minimal overhead.

### 2. Role-Based Redirect in UserDashboard (`src/pages/UserDashboard.tsx`)
Add a guard at the top of `UserDashboard`: if `profile?.role === "admin"`, redirect to `/admin`. If `profile?.role === "driver"`, redirect to `/driver`. This handles cases where users navigate directly to `/dashboard`.

## Files
- `src/pages/Login.tsx` — add role check after login, route to correct dashboard
- `src/pages/UserDashboard.tsx` — add role-based redirect guard

No database changes needed.

