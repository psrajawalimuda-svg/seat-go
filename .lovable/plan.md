

# Implement Full Database Connection

## Overview
Most pages already query the database via `use-supabase-data.ts` hooks. The remaining gaps are: the **reviews** system (stubbed), **driver identity** (hardcoded `d1`), **DriverTrips tab filtering** (uses array slicing instead of real date/status logic), and the **pickup_points admin** CRUD (missing some DB columns like `address`, `phone`, `operating_hours`, `is_active`).

## Step 1 — Create `reviews` Table (Migration)

```sql
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  driver_id text NOT NULL,
  passenger_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  trip_date text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert reviews" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public delete reviews" ON public.reviews FOR DELETE TO anon, authenticated USING (true);
```

## Step 2 — Add Missing Columns to `pickup_points` (Migration)

```sql
ALTER TABLE public.pickup_points
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS operating_hours text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
```

## Step 3 — Wire `useReviews()` Hook to Real Table

Replace the stub in `use-supabase-data.ts` with actual Supabase queries:
- `queryFn`: SELECT from `reviews` joined with `trips` and `drivers`
- `insert`: INSERT into `reviews`, invalidate query
- `deleteReview`: DELETE from `reviews`, invalidate query

## Step 4 — Fix DriverTrips Tab Filtering

In `src/pages/driver/DriverTrips.tsx`, replace the fake array slicing with real date-based logic:
- **Hari Ini**: trips where `departureDate` matches today
- **Akan Datang**: trips where `departureDate` is after today
- **Riwayat**: trips where `actualCompletion` is not null

## Step 5 — Fix Driver Identity in DriverHome & DriverTripDetail

Currently `DriverHome` picks `drivers?.[0]` and `DriverTripDetail` hardcodes `driverId === "d1"`. Replace with `localStorage`-based driver selection (similar to passenger phone pattern) until auth is implemented:
- Store selected `driver_id` in localStorage
- Filter trips by `driverId` match
- Remove hardcoded `"d1"` check

## Step 6 — Update `DbPickupPoint` Interface and `toPickupPoint`

Update the interface in `use-supabase-data.ts` to include the new columns (`address`, `phone`, `operating_hours`, `is_active`) now that they exist in the DB. The `toPickupPoint` helper already maps them — just needs the types file to regenerate.

## Step 7 — Fix `toBooking` Destination

Pass trip data to `toBooking()` calls so destination is derived from `route_name` instead of hardcoded `"Unknown"`. Update call sites in `DriverHome.tsx`, `DriverTripDetail.tsx`, and `BookingsManagement.tsx`.

## Files Modified
- `src/hooks/use-supabase-data.ts` (reviews hook, toBooking signature)
- `src/pages/driver/DriverTrips.tsx` (real date filtering)
- `src/pages/driver/DriverHome.tsx` (driver identity via localStorage)
- `src/pages/driver/DriverTripDetail.tsx` (remove hardcoded d1)
- 2 database migrations (reviews table, pickup_points columns)

## Technical Details
- No new dependencies
- Reviews table uses public RLS (no auth yet)
- Driver selection stored in localStorage as interim solution
- All existing pages already use the Supabase hooks — this fills the remaining gaps

