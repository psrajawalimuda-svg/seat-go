

# Implement Real-Time Map

## Overview
The app already has real-time GPS infrastructure (driver broadcasts location via `useTripTracking`, passenger tracks via `DriverTracking.tsx` with Supabase Realtime). The main gap is: **the Admin Dashboard has no live map**, and the **driver's trip detail page has no map showing all active drivers**. This plan adds a real-time map to the Admin Dashboard showing all active drivers on a single map, and ensures the existing passenger tracking map works end-to-end.

## Changes

### 1. Admin Real-Time Fleet Map (`src/pages/admin/Dashboard.tsx`)

Add a Leaflet map card to the admin dashboard that:
- Subscribes to `driver_locations` table via Supabase Realtime (all rows, not filtered by trip)
- Shows all active driver positions as bus markers on a single map
- Displays driver name, speed, current route in marker popups
- Auto-updates as drivers broadcast their GPS
- Shows pickup points as small dots for route context
- Includes driver count badge and "last updated" timestamp

### 2. Create `src/components/admin/FleetMap.tsx`

New component containing:
- `MapContainer` with all driver markers from `driver_locations`
- Realtime subscription to `driver_locations` table (all changes)
- Join driver info (name, plate) from the `useDrivers()` hook
- Color-coded markers: green = on-time, red = delayed, gray = stale (>30s)
- Route polyline from pickup points
- Responsive height: 400px on desktop

### 3. Ensure Driver GPS Broadcasting Works

The `useTripTracking` hook already broadcasts to `driver_locations` via upsert. Verify it works with UUID trip IDs (the `trip_id` column is `text` type, so UUIDs work fine as strings).

### 4. Enable Realtime for Reviews Table (Minor)

Add `ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;` — the reviews table was created after the initial realtime setup, so it's not currently in the publication. This is a minor addition but ensures consistency.

## Files
- **New**: `src/components/admin/FleetMap.tsx`
- **Modified**: `src/pages/admin/Dashboard.tsx` (add FleetMap card)
- **Migration**: Enable realtime on reviews table

## Technical Details
- Uses existing `driver_locations` table and its realtime publication
- No new dependencies (Leaflet already installed)
- Fleet map fetches initial positions via SELECT, then listens for realtime updates
- Stale detection: markers older than 30s show reduced opacity
- Admin map is read-only (no GPS broadcasting)

