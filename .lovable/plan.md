

# Fix Build Errors

## 6 errors to fix across 4 files

### 1. `src/pages/admin/TripsManagement.tsx`
- **Line 35**: Remove `import { getServiceScale } from "@/lib/pricing"` — function doesn't exist
- **Lines 201-216 (`openAdd`)**: Add 8 missing pricing fields: `accommodation_cost: "0"`, `meal_cost: "0"`, `attraction_tickets_cost: "0"`, `guide_fee: "0"`, `other_costs: "0"`, `markup_percentage: "15"`, `tax_percentage: "11"`, `min_margin_percentage: "10"`
- **Lines 222-237 (`openEdit`)**: Add same 8 pricing fields (using `String(t.xxx || "0")` pattern for edit)

### 2. `src/pages/DriverTracking.tsx`
- **Line 70-77**: Add `driver_id?: string` to `DriverLocation` interface

### 3. `src/test/data-mapping.test.ts`
- **Lines 19 & 46**: Add missing properties to both `DbTrip` mocks: `rayon_id: null`, `start_pickup_point_id: null`, `budget: null`, `description: null`

### 4. `supabase/functions/.keep`
- Create empty file to satisfy directory check

## Files
- `src/pages/admin/TripsManagement.tsx`
- `src/pages/DriverTracking.tsx`
- `src/test/data-mapping.test.ts`
- `supabase/functions/.keep`

