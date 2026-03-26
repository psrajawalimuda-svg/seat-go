

# Admin Dashboard for ShuttleGo

## Overview
Build a comprehensive admin dashboard with sidebar navigation to manage drivers, trips, bookings, pickup points, and view analytics. The dashboard will use mock data (same pattern as existing app) and be accessible via `/admin` routes.

## New Files to Create

### 1. Admin Data & Types (`src/data/admin-data.ts`)
- `Driver` interface (id, name, phone, plate, status, photo, rating, totalTrips)
- `BookingRecord` interface extending existing Booking with passenger info and status
- Mock arrays: `MOCK_DRIVERS`, `MOCK_BOOKINGS`
- Stats helper functions

### 2. Admin Layout (`src/components/admin/AdminLayout.tsx`)
- Sidebar using Shadcn Sidebar component with sections: Dashboard, Drivers, Trips, Bookings, Pickup Points
- Header with admin title and sidebar trigger
- Responsive layout with collapsible sidebar

### 3. Admin Pages
- **`src/pages/admin/Dashboard.tsx`** — Overview with stat cards (total bookings, revenue, active drivers, trips today), recent bookings table, quick charts
- **`src/pages/admin/DriversManagement.tsx`** — Driver list table with status badges, add/edit driver dialog, toggle active/inactive
- **`src/pages/admin/TripsManagement.tsx`** — Trips table showing route, time, seats, driver assignment; add/edit trip dialog
- **`src/pages/admin/BookingsManagement.tsx`** — All bookings table with filters, status management (paid/cancelled/completed)
- **`src/pages/admin/PickupPointsManagement.tsx`** — List of J1-J17 points, edit names/times, reorder

### 4. Shared Admin Components
- `src/components/admin/StatCard.tsx` — Reusable metric card with icon, value, label, trend
- `src/components/admin/AdminSidebar.tsx` — Sidebar navigation component

## Routes (in App.tsx)
Add nested admin routes:
```
/admin → Dashboard
/admin/drivers → DriversManagement
/admin/trips → TripsManagement  
/admin/bookings → BookingsManagement
/admin/pickup-points → PickupPointsManagement
```

## Design
- Desktop-optimized layout (sidebar + content area)
- Consistent with app's blue primary color scheme
- Uses existing Shadcn components: Table, Card, Dialog, Badge, Button, Tabs
- Stat cards with icons and trend indicators
- Tables with search/filter capabilities

## Technical Details
- All data is mock/local state (no backend) — consistent with current app pattern
- CRUD operations update local state via `useState`
- Add/Edit forms use Shadcn Dialog with form inputs
- Driver management includes: name, phone, vehicle plate, status toggle
- No authentication gate (can be added later with Lovable Cloud)

