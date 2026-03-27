

# Performance & Speed Optimization Plan

## Issues Found

### 1. No Code Splitting — All Pages Loaded Eagerly
**Impact: HIGH** — Every page (Home, Admin Dashboard, DriversManagement with Leaflet+MarkerCluster, etc.) is bundled together and loaded on first visit, even if the user only visits the login page.

**Fix**: Use `React.lazy()` + `Suspense` for all route components in `App.tsx`. Only `FleetMap` currently uses lazy loading.

### 2. Admin Dashboard Fires 5 Parallel Queries on Mount
**Impact: MEDIUM** — `AdminDashboard` calls `useDrivers()`, `useTrips()`, `useBookings()`, `usePickupPoints()`, `useReviews()` simultaneously. The `useReviews()` hook is the worst offender — it makes **3 sequential queries** (reviews → trips → drivers) in a single call.

**Fix**: 
- Add `staleTime` to all React Query hooks (e.g. 30s for drivers, 60s for pickup points) so navigating between admin pages doesn't re-fetch everything.
- Refactor `useReviews()` to use a database JOIN or view instead of 3 separate fetches.

### 3. No React Query `staleTime` Configuration
**Impact: HIGH** — Default `staleTime` is `0`, meaning every component mount triggers a re-fetch. Navigating between pages causes redundant API calls.

**Fix**: Configure `QueryClient` with sensible defaults:
```text
defaultOptions.queries.staleTime = 30_000  (30s)
defaultOptions.queries.gcTime = 300_000     (5min)
```

### 4. AuthContext Double-Fetches on Login
**Impact: MEDIUM** — When a user logs in, `onAuthStateChange` fires `fetchProfile()`, which calls both `profiles` SELECT and `get_user_login_info` RPC. But the Login page *also* calls `get_user_login_info` RPC separately. That's 3 network requests where 1 would suffice.

**Fix**: After login in `Login.tsx`, navigate immediately and let `AuthContext` handle the profile fetch. Remove the duplicate RPC call from login handler, or skip the AuthContext fetch when login already has the info.

### 5. ProtectedAdminRoute Uses `useEffect` + `setState` Instead of React Query
**Impact: LOW** — Admin role check uses a manual `useEffect` pattern, causing an extra render cycle and no caching.

**Fix**: Use `useQuery` like `ProtectedDriverRoute` does, with caching.

### 6. Heavy Leaflet Imports on Non-Map Pages
**Impact: MEDIUM** — `DriversManagement.tsx` imports Leaflet, MarkerCluster, and react-leaflet-cluster at the top level (line 24-29). These are large libraries loaded even when the user is just viewing the driver list tab.

**Fix**: Split the map view into a separate lazy-loaded component within `DriversManagement`.

### 7. No Pagination on Data Queries
**Impact: MEDIUM (scales poorly)** — `useBookings()`, `useDrivers()`, `useTrips()` all fetch entire tables. With hundreds/thousands of records this will get slow.

**Fix**: Add `.limit(50)` to dashboard queries and implement pagination for admin management tables.

## Implementation

### Step 1 — Configure QueryClient Defaults (`src/App.tsx`)
Set global `staleTime: 30_000` and `gcTime: 300_000` to prevent redundant re-fetches.

### Step 2 — Lazy Load All Route Components (`src/App.tsx`)
Wrap all page imports with `React.lazy()` and wrap `<Routes>` in `<Suspense>`. This dramatically reduces initial bundle size.

### Step 3 — Optimize `useReviews()` Hook (`src/hooks/use-supabase-data.ts`)
Remove the 3-query waterfall. Use Supabase foreign key joins: `reviews.select("*, trip:trips(*), driver:drivers(*)")` — single query instead of 3.

### Step 4 — Remove Duplicate RPC in Login (`src/pages/Login.tsx`)
After successful auth, use the `loginInfo` already fetched to set a temporary flag, and let AuthContext `fetchProfile` handle the rest without re-calling the RPC.

### Step 5 — Fix ProtectedAdminRoute (`src/components/admin/ProtectedAdminRoute.tsx`)
Replace `useEffect`+`useState` with `useQuery` for caching and consistency.

### Step 6 — Lazy Load Map in DriversManagement (`src/pages/admin/DriversManagement.tsx`)
Extract map section into a lazy-loaded sub-component to avoid loading Leaflet on every admin page.

### Step 7 — Add Query Limits (`src/hooks/use-supabase-data.ts`)
Add `.limit(100)` to bookings and reviews queries to prevent unbounded data fetching.

## Files Modified
- `src/App.tsx` — lazy imports, QueryClient defaults, Suspense wrapper
- `src/hooks/use-supabase-data.ts` — staleTime per hook, reviews JOIN, query limits
- `src/pages/Login.tsx` — remove duplicate RPC call
- `src/components/admin/ProtectedAdminRoute.tsx` — use useQuery
- `src/pages/admin/DriversManagement.tsx` — lazy load map section

## Technical Details
- No database changes needed
- No new dependencies
- All changes are backward-compatible
- Expected improvement: ~40-60% reduction in initial load time, ~50% fewer API calls during navigation

