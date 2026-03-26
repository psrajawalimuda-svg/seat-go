

# Driver Mobile App UI/UX

## Overview
Build a full mobile-first driver app accessible at `/driver/*` routes. This is the companion app for drivers — optimized for handheld use while driving/operating shuttles.

## Screens

### 1. Driver Home (`/driver`) — `src/pages/driver/DriverHome.tsx`
- **Greeting header** with driver name, avatar, and status toggle (Online/Offline)
- **Today's summary cards**: total trips, passengers, earnings
- **Active trip card** (if on-trip): route name, departure time, next pickup point, tap to navigate
- **Upcoming trips list**: card-based, showing route, time, booked passengers count
- **Bottom tab navigation**: Home, Trips, Passengers, Profile

### 2. Trip Detail (`/driver/trip/:id`) — `src/pages/driver/DriverTripDetail.tsx`
- **Route info header**: route name, departure time, vehicle plate
- **Pickup points timeline**: vertical stepper showing all J1-J17 stops with:
  - Stop label & name
  - Estimated time
  - Number of passengers boarding at each stop
  - Status indicator (upcoming / current / completed)
- **Passenger list** per stop: name, seat number, phone (tap to call)
- **"Start Trip" / "Arrive at Stop" / "Complete Trip"** action button at bottom
- **Interactive map** showing the route with current position

### 3. My Trips (`/driver/trips`) — `src/pages/driver/DriverTrips.tsx`
- **Tab navigation**: Today, Upcoming, History
- **Trip cards**: route, time, passenger count, earnings, status badge
- Tap to open trip detail

### 4. Passenger Manifest (`/driver/passengers`) — `src/pages/driver/DriverPassengers.tsx`
- **Grouped by trip**: collapsible sections
- Each passenger: name, pickup point, seat number, status (boarded/waiting/no-show)
- Quick actions: call, mark as boarded

### 5. Driver Profile (`/driver/profile`) — `src/pages/driver/DriverProfile.tsx`
- **Profile card**: name, photo placeholder, phone, vehicle plate
- **Stats**: rating, total trips, this month earnings
- **Settings**: notifications toggle, language
- **Logout button**

## Shared Components

### `src/components/driver/DriverBottomNav.tsx`
- Fixed bottom tab bar with 4 tabs: Home, Trips, Passengers, Profile
- Icons + labels, active state highlight with primary color

### `src/components/driver/TripCard.tsx`
- Reusable card showing trip summary (route, time, seats, status)

### `src/components/driver/PickupTimeline.tsx`
- Vertical timeline component for pickup point progression

## Technical Details
- All screens use `mobile-container` (max-w-md mx-auto) like existing passenger app
- Uses existing design tokens (shuttle-card, shuttle-gradient, tap-highlight)
- Mock data from existing `MOCK_TRIPS`, `MOCK_DRIVERS`, `MOCK_BOOKINGS`
- Simulates a logged-in driver (hardcoded as "Pak Ahmad" / driver d1)
- Framer Motion for page transitions and microinteractions
- Leaflet map on trip detail for route visualization
- Routes added under `/driver/*` in App.tsx

## File Structure
```text
src/
├── components/driver/
│   ├── DriverBottomNav.tsx
│   ├── TripCard.tsx
│   └── PickupTimeline.tsx
├── pages/driver/
│   ├── DriverHome.tsx
│   ├── DriverTripDetail.tsx
│   ├── DriverTrips.tsx
│   ├── DriverPassengers.tsx
│   └── DriverProfile.tsx
```

## Routes (App.tsx)
```
/driver         → DriverHome
/driver/trip/:id → DriverTripDetail
/driver/trips   → DriverTrips
/driver/passengers → DriverPassengers
/driver/profile → DriverProfile
```

