

# Connect Entire App to Database

## Overview
Migrate all mock data (drivers, trips, bookings, pickup points) to Lovable Cloud database tables, and update every page that currently reads from `MOCK_*` constants to query the database instead. Seed the database with the existing mock data.

## Step 1 — Create Database Tables (Migration)

Create 4 tables:

**`drivers`**: id (uuid, PK), name, phone, plate, status (text: active/inactive/on-trip), rating (float, default 0), total_trips (int, default 0), created_at

**`trips`**: id (uuid, PK), route_name, departure_time, base_price (int), total_seats (int), booked_seats (int[], default '{}'), driver_id (uuid FK → drivers), created_at

**`bookings`**: id (uuid, PK), trip_id (uuid FK → trips), passenger_name, passenger_phone, pickup_point_id (text), seat_number (int), date (text), total_price (int), status (text: paid/completed/cancelled), booked_at (timestamptz)

**`pickup_points`**: id (text, PK), label, name, order_index (int), minutes_from_start (int), lat (float), lng (float)

All tables: RLS enabled, public read/write policies (no auth yet, matching current pattern). Enable realtime on all tables.

## Step 2 — Seed Data (Insert)

Insert existing mock data from `shuttle-data.ts` and `admin-data.ts` into the new tables using the insert tool.

## Step 3 — Create React Query Hooks (`src/hooks/use-supabase-data.ts`)

Custom hooks wrapping Supabase queries:
- `useDrivers()` — fetch/mutate drivers
- `useTrips()` — fetch/mutate trips (join driver info)
- `useBookings()` — fetch/mutate bookings
- `usePickupPoints()` — fetch pickup points (ordered)

Each hook returns `{ data, isLoading, error }` plus mutation functions for CRUD.

## Step 4 — Update All Pages

Replace every `MOCK_*` import with database queries:

| Page | Current Source | New Source |
|------|--------------|------------|
| `Home.tsx` | `PICKUP_POINTS` | `usePickupPoints()` |
| `SearchResults.tsx` | `MOCK_TRIPS` | `useTrips()` |
| `SeatSelection.tsx` | `MOCK_TRIPS` | `useTrips()` |
| `Checkout.tsx` | `MOCK_TRIPS` | `useTrips()` |
| `ETicket.tsx` | `MOCK_TRIPS` | `useTrips()` |
| `DriverTracking.tsx` | `MOCK_TRIPS`, `PICKUP_POINTS` | `useTrips()`, `usePickupPoints()` |
| `admin/Dashboard.tsx` | All mocks | All hooks |
| `admin/DriversManagement.tsx` | `MOCK_DRIVERS` | `useDrivers()` |
| `admin/TripsManagement.tsx` | `MOCK_TRIPS`, `MOCK_DRIVERS` | `useTrips()`, `useDrivers()` |
| `admin/BookingsManagement.tsx` | `MOCK_BOOKINGS` | `useBookings()` |
| `admin/PickupPointsManagement.tsx` | `PICKUP_POINTS` | `usePickupPoints()` |
| `driver/DriverHome.tsx` | All mocks | All hooks |
| `driver/DriverTripDetail.tsx` | `MOCK_TRIPS`, `MOCK_BOOKINGS`, `PICKUP_POINTS` | Hooks |
| `driver/DriverTrips.tsx` | `MOCK_TRIPS` | `useTrips()` |
| `driver/DriverPassengers.tsx` | `MOCK_BOOKINGS`, `MOCK_TRIPS`, `PICKUP_POINTS` | Hooks |

## Step 5 — Wire CRUD Operations

- **Admin Drivers**: Add/edit → `supabase.from('drivers').upsert()`
- **Admin Trips**: Add/edit → `supabase.from('trips').upsert()`
- **Admin Bookings**: Status toggle → `supabase.from('bookings').update()`
- **Admin Pickup Points**: Edit → `supabase.from('pickup_points').update()`
- **Checkout payment**: Insert booking → `supabase.from('bookings').insert()`, update trip `booked_seats`

## Step 6 — Update BookingContext

Update `BookingContext.tsx` to work with database IDs (uuid) instead of mock string IDs. The context remains in-memory for the booking flow but references real database records.

## Technical Details
- Keep `shuttle-data.ts` utility functions (`formatPrice`, `getPickupTime`) — only remove mock data arrays
- Add loading states (skeleton) on all pages while data fetches
- Use `@tanstack/react-query` (already installed) via the Supabase hooks for caching
- Trip's `driver_id` foreign key replaces storing `driverName/driverPhone/vehiclePlate` directly — join on query
- ~15 files modified, 1 new hooks file, 4 database tables created

