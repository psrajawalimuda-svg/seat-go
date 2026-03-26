

# Accurate Seat Layouts by Vehicle Type

## Overview
Replace the current generic grid-based seat layout with vehicle-type-specific layouts that match real shuttle configurations. Each trip will have a `vehicle_type` field that determines the exact seat arrangement shown on the seat selection screen.

## Vehicle Types & Layouts

```text
MINIBUS (3 seats):
┌─────────────────┐
│ [1]     [DRIVER] │  Row 1
│ [2]  [3]         │  Row 2
│ ═══ BAGGAGE ═══  │  Row 3
└─────────────────┘

MINIBUS_ROOF (5 seats):
┌─────────────────┐
│ [1]     [DRIVER] │  Row 1
│ [2]  [3]         │  Row 2
│ [4]  [5]         │  Row 3
│ ══ BAGGAGE ROOF ══│
└─────────────────┘

HIACE (10 seats):
┌─────────────────┐
│ [1]     [DRIVER] │  Row 1
│ [2] [3] [4]      │  Row 2
│ [5] [6] [7]      │  Row 3
│ [8] [9] [10]     │  Row 4
│ ═══ BAGGAGE ═══  │
└─────────────────┘
```

## Database Changes

**Migration**: Add `vehicle_type` column to `trips` table:
```sql
ALTER TABLE trips ADD COLUMN vehicle_type text NOT NULL DEFAULT 'hiace';
```

Valid values: `minibus`, `minibus_roof`, `hiace`

**Update existing trips** to set appropriate vehicle types and correct `total_seats` values.

## Code Changes

### 1. Define Seat Layout Config (`src/data/shuttle-data.ts`)
Add a `VEHICLE_LAYOUTS` constant mapping each vehicle type to its row structure:
- Each row is an array of cell types: `"seat"`, `"driver"`, `"empty"`, `"baggage"`, `"baggage_roof"`
- Includes `totalSeats`, `label` (display name), and `rows` definition

### 2. Update `SeatSelection.tsx`
- Import vehicle layout config
- Read `vehicle_type` from the trip (via `toTrip`)
- Replace the generic `cols/rows` grid with layout-driven rendering
- Render driver cell with steering wheel icon in row 1
- Render baggage row at the bottom with a luggage icon/label
- Each seat cell uses the existing `SeatIcon` component

### 3. Update `use-supabase-data.ts`
- Add `vehicle_type` to `DbTrip` interface
- Pass `vehicleType` through in `toTrip()` converter

### 4. Update `TripsManagement.tsx` (Admin)
- Add vehicle type selector (Select dropdown) in the add/edit trip dialog
- Options: Mini Bus (3 seats), Mini Bus + Roof Rack (5 seats), HiAce (10 seats)
- Auto-set `total_seats` when vehicle type changes
- Show vehicle type column in the trips table

## Technical Details
- `vehicle_type` defaults to `hiace` so existing trips continue working
- The seat numbering follows the exact order from the reference layouts
- Baggage rows are non-interactive visual elements
- Driver cell is a fixed non-interactive element with an icon

