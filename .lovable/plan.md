

# Maximize Mobile Phone Display for Driver & User

## Overview
Optimize the app layout so it uses the full phone screen width and feels native on mobile devices, while remaining centered on desktop/tablet. Currently `.mobile-container` uses `max-w-md` (448px) which is fine but could be expanded, and several mobile UX patterns need improvement.

## Changes

### 1. Expand Container Width & Add Safe Areas (`src/index.css`)
- Change `.mobile-container` from `max-w-md` to `max-w-[480px]` for slightly wider phone support
- Add `viewport-fit=cover` support for notched phones
- Add safe area padding utilities (`safe-bottom`, `safe-top`)
- Ensure `ScreenHeader` and `BottomCTA` respect safe areas

### 2. Update `index.html` Viewport Meta
- Add `viewport-fit=cover` to the viewport meta tag for edge-to-edge display on notched phones
- Update title to "ShuttleGo"

### 3. Fix `ScreenHeader.tsx`
- Add `safe-area-inset-top` padding so the header doesn't overlap the phone notch/status bar

### 4. Fix `BottomCTA.tsx`
- Add `pb-[env(safe-area-inset-bottom)]` so the bottom CTA avoids the home indicator on notched phones

### 5. Fix `DriverBottomNav.tsx`
- Already has safe area spacer — verify it works with `viewport-fit=cover`

### 6. Optimize Touch Targets & Spacing (All Pages)
- Ensure all interactive elements are at least 44px touch targets
- Add `touch-action: manipulation` to prevent double-tap zoom on buttons
- Add `-webkit-overflow-scrolling: touch` for smooth scrolling

### 7. User Pages Mobile Polish
- **Home.tsx**: Adjust header padding for safe area top
- **SearchResults.tsx**: Ensure trip cards use full width with proper padding
- **SeatSelection.tsx**: Make seat grid responsive — scale seat size on smaller screens
- **Checkout.tsx**: Ensure form inputs don't get obscured by keyboard (scroll into view)
- **ETicket.tsx**: QR code and actions fill width properly
- **DriverTracking.tsx**: Map height responsive to screen, bottom info card doesn't overlap

### 8. Driver Pages Mobile Polish
- **DriverHome.tsx**: Header gradient uses safe area top, stats grid fills width
- **DriverTripDetail.tsx**: Map height adapts to screen, bottom CTA uses safe area
- **DriverTrips.tsx**: Tab bar scrolls horizontally if needed
- **DriverPassengers.tsx**: Passenger list items have proper touch targets
- **DriverProfile.tsx**: Profile card and settings fill width

### 9. Global CSS Enhancements (`src/index.css`)
- Add `overscroll-behavior: none` to prevent pull-to-refresh interference
- Add selection color for branded feel
- Smooth scrolling behavior

## Files Modified
- `index.html` (viewport meta)
- `src/index.css` (utilities, safe areas, touch optimizations)
- `src/components/ScreenHeader.tsx`
- `src/components/BottomCTA.tsx`
- `src/components/driver/DriverBottomNav.tsx`
- `src/pages/Home.tsx`
- `src/pages/SeatSelection.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/ETicket.tsx`
- `src/pages/DriverTracking.tsx`
- `src/pages/driver/DriverHome.tsx`
- `src/pages/driver/DriverTripDetail.tsx`
- `src/pages/driver/DriverTrips.tsx`
- `src/pages/driver/DriverPassengers.tsx`
- `src/pages/driver/DriverProfile.tsx`

## Technical Details
- `viewport-fit=cover` enables edge-to-edge rendering on iOS
- `env(safe-area-inset-*)` CSS functions handle notch/home indicator spacing
- No database changes needed
- No new dependencies

