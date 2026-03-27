

# Optimize Driver Login Speed

## Problem
Driver login makes **3 sequential network calls**:
1. `signInWithPassword` → waits
2. `get_user_login_info` RPC → waits
3. Then `AuthContext.fetchProfile` fires again (triggered by `onAuthStateChange`) doing **another** `profiles` SELECT + `get_user_login_info` RPC — duplicating call #2

For pending/rejected drivers, there's a **4th call**: `signOut()` after already logging in.

Total: ~4 round trips, each 200-500ms = 1-2 seconds of waiting.

## Solution

### 1. Remove duplicate RPC in Login.tsx
After `signInWithPassword`, skip the `get_user_login_info` call. Instead, navigate immediately and let `AuthContext.fetchProfile` handle role detection. The `ProtectedDriverRoute` already checks approval status and blocks unapproved drivers with a proper UI.

This removes 1 full RPC call (~300ms) and the conditional `signOut()` call for pending drivers.

### 2. Simplify Login handler
- Login success → check cached profile or just navigate to `/dashboard`
- `AuthContext` resolves role → triggers redirect via route guards
- Pending/rejected blocking happens in `ProtectedDriverRoute` (already implemented)

### 3. Optimize AuthContext.fetchProfile
Run `profiles` SELECT and `get_user_login_info` RPC in `Promise.all` (already done — confirmed). But add early return from cache when navigating between pages.

## Changes

### `src/pages/Login.tsx`
- Remove lines 68-106 (the `get_user_login_info` RPC call and all driver status checks)
- After successful auth, navigate based on simple logic: just go to `/dashboard` and let route guards handle redirection
- Remove `pendingMessage` state and the pending/rejected UI (moved to `ProtectedDriverRoute`)
- Keep signup flow unchanged

### `src/context/AuthContext.tsx`
- Store role resolution result immediately after `fetchProfile` completes so navigation is instant on subsequent mounts

## Result
- Login: 1 network call (`signInWithPassword`) → instant navigation
- Role check happens in background via `AuthContext`
- Route guards (`ProtectedDriverRoute`, `ProtectedAdminRoute`) handle access control
- Expected improvement: ~50-70% faster login (from ~1.5s to ~500ms)

## Files
- `src/pages/Login.tsx` — simplify login handler, remove RPC call
- No other files need changes (route guards already handle blocking)

