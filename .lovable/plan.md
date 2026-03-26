

# Enhanced E-Ticket Page

## Overview
Improve the E-Ticket page with a proper QR code, richer trip details, share/download functionality, and polished mobile UI.

## Changes

### 1. Install QR Code Library
Add `qrcode.react` to generate a real QR code from booking data instead of the current random pixel grid.

### 2. Rebuild `src/pages/ETicket.tsx`

**QR Code**: Generate a deterministic QR code encoding a JSON payload with `bookingId`, `tripId`, `seatNumber`, and `date`. Displayed in a styled container with the "Show this QR to the driver" label.

**Trip Details Card**: Expand the info section to include:
- Route name with vehicle type badge
- Date of travel
- Pickup point (label + name)
- Pickup time
- Seat number
- Passenger name (from booking context — currently not stored, will show date instead)
- "Paid" status badge (already exists, keep)

**Share/Download Buttons**: Add two action buttons below the ticket card:
- **Share** — uses `navigator.share()` Web Share API (with fallback to clipboard copy) to share ticket details as text
- **Download** — uses `html2canvas` or a simpler approach: generate a text summary and trigger download as a `.txt` file (no heavy dependency). Alternative: use `window.print()` targeting the ticket card for PDF-like output.

**UI Polish**:
- Ticket-style card with tear-line divider (keep existing dashed border + circle cutouts)
- Booking reference ID displayed at top of card (use a short hash of trip+seat+date)
- Subtle entrance animations (already present, refine timing)

### 3. Add Booking Reference
Generate a short booking reference code (e.g., `SG-XXXX`) from the booking data for display on the ticket. This is purely cosmetic — derived from a hash of tripId + seatNumber.

## Technical Details
- Install: `qrcode.react`
- Modified file: `src/pages/ETicket.tsx`
- No database changes needed
- Share API has graceful fallback for unsupported browsers
- Download uses `window.print()` with a print-specific CSS media query for clean output

