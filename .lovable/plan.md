

# Full Application Review & Database Migration

## Review Summary

After auditing all files, database schema, and console logs, here are the gaps:

### Missing Database Columns
The `drivers` table in the DB has: `id, name, phone, plate, status, rating, total_trips, user_id, created_at`. But the code (`DbDriver` interface and `DriversManagement.tsx`) references **6 missing columns**: `email`, `license_number`, `latitude`, `longitude`, `bearing`, `last_active`.

### Missing Foreign Keys
- `reviews.booking_id` has no FK to `bookings.id`
- `reviews.trip_id` has no FK to `trips.id`
- `driver_locations.driver_id` is `text` but should reference `drivers.id`

### Missing Trigger
The `handle_new_user` function exists but the trigger `on_auth_user_created` on `auth.users` is not attached (the system reports "There are no triggers in the database"). This means profile auto-creation on signup is broken.

### Security: Roles on Profiles Table
Roles are stored directly on `profiles.role` instead of a separate `user_roles` table. Per security guidelines, this is a privilege escalation risk.

### Admin Routes Unprotected
All `/admin/*` routes are publicly accessible with no auth guard.

### Console Warnings
- `DialogFooter` ref warning in `DriversManagement.tsx` (minor)

---

## Migration Plan

### Migration 1 — Add Missing Driver Columns

```sql
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS bearing double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active timestamptz;
```

### Migration 2 — Add Foreign Keys to Reviews

```sql
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  ADD CONSTRAINT reviews_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;
```

### Migration 3 — Create User Roles Table (Security Best Practice)

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'passenger');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Migration 4 — Re-attach Profile Trigger

```sql
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Migration 5 — Add Update Policy for Reviews

```sql
CREATE POLICY "Public update reviews" ON public.reviews
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
```

## Code Changes

### 1. Update `AuthContext.tsx`
- Query `user_roles` table via `has_role()` function instead of reading `profiles.role` directly.

### 2. Create Admin Auth Guard
- New `ProtectedAdminRoute` component checking `has_role(uid, 'admin')`.
- Wrap all `/admin/*` routes in `App.tsx`.

### 3. Create Admin Login Page
- `/admin/login` with email/password form, similar to driver login.

### 4. Update `use-supabase-data.ts`
- `DbDriver` interface already has the new columns — no change needed since the types file will auto-regenerate.

## Files Modified
- **New**: `src/components/admin/ProtectedAdminRoute.tsx`, `src/pages/admin/AdminLogin.tsx`
- **Modified**: `src/context/AuthContext.tsx`, `src/App.tsx`
- **Migrations**: 5 SQL migrations

## Technical Details
- All migrations are additive (no breaking changes)
- Existing data is preserved — new columns are nullable or have defaults
- `user_roles` table follows the security guidelines exactly
- Admin routes require `admin` role in `user_roles` table
- Driver routes continue using existing auth flow

