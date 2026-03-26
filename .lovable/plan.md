

# Driver Authentication with Login & Signup

## Overview
Add authentication for drivers so they can log in with email/password, have their identity linked to the `drivers` table, and access only their own data. Replace the current `localStorage`-based driver identity with real auth.

## Step 1 — Database Migration

Create a `profiles` table and link drivers to auth users:

```sql
-- Profiles table for all authenticated users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'passenger',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Auto-insert profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id column to drivers table to link driver to auth user
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
```

## Step 2 — Create Driver Login Page (`src/pages/driver/DriverLogin.tsx`)

- Email + password login form
- Signup form with name, phone, email, password
- On signup: create auth user, then link to existing driver record (by phone match) or show "not registered as driver" message
- Redirect to `/driver` on success
- Mobile-optimized UI matching existing driver app style

## Step 3 — Update AuthContext (`src/context/AuthContext.tsx`)

- Wire `fetchProfile()` to actually query the `profiles` table
- Expose `profile.role` so driver pages can check role

## Step 4 — Create ProtectedDriverRoute Component

- Wrapper component that checks `useAuth()` for logged-in user
- If not logged in → redirect to `/driver/login`
- Used on all `/driver/*` routes

## Step 5 — Update Driver Pages

- **DriverHome.tsx**: Replace `localStorage` driver ID with `auth.uid()` → query `drivers` where `user_id = auth.uid()`
- **DriverProfile.tsx**: Show real profile data, add logout button that calls `signOut()`
- **DriverTripDetail.tsx**: Remove hardcoded driver fallback, use auth-linked driver

## Step 6 — Update App.tsx Routes

- Add `/driver/login` route
- Wrap all `/driver/*` routes (except login) with the protected route component
- Add `AuthProvider` wrapper

## Files Modified
- **New**: `src/pages/driver/DriverLogin.tsx`, `src/components/driver/ProtectedDriverRoute.tsx`
- **Modified**: `src/context/AuthContext.tsx`, `src/App.tsx`, `src/pages/driver/DriverHome.tsx`, `src/pages/driver/DriverProfile.tsx`, `src/pages/driver/DriverTripDetail.tsx`
- **Migration**: 1 new migration (profiles table + drivers.user_id column)

## Technical Details
- Email confirmation is required by default (no auto-confirm)
- Driver signup links to existing `drivers` record by matching phone number
- `localStorage` driver ID pattern is fully replaced by auth
- No changes to passenger/public routes — they remain unauthenticated for now

