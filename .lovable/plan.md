

# Driver Onboarding & Vehicle Assignment Flow

## Overview
Implement a full driver onboarding pipeline: signup → admin review → approval → driver completes profile (upload KTP, SIM, photo) → admin assigns vehicle.

## Step 1 — Database Changes (3 migrations)

### Migration 1: Add driver approval columns
```sql
ALTER TABLE drivers ADD COLUMN approval_status text NOT NULL DEFAULT 'pending';
-- Values: pending, approved, rejected
ALTER TABLE drivers ADD COLUMN ktp_url text;
ALTER TABLE drivers ADD COLUMN sim_url text;
ALTER TABLE drivers ADD COLUMN photo_url text;
ALTER TABLE drivers ADD COLUMN rejection_reason text;
```

### Migration 2: Create storage bucket for driver documents
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', true);

CREATE POLICY "Drivers upload own docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read driver docs" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'driver-documents');

CREATE POLICY "Drivers update own docs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'driver-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Migration 3: Add vehicle assignment column
```sql
ALTER TABLE drivers ADD COLUMN assigned_vehicle text;
-- Admin sets this (e.g., "Toyota Hiace - B 1234 XY")
```

## Step 2 — Fix Build Error in DriverProfile.tsx
Add missing `Badge` import from `@/components/ui/badge`.

## Step 3 — Update Signup Flow (`src/pages/Login.tsx`)
- On driver signup: create a new row in `drivers` table with `approval_status = 'pending'` and link `user_id`
- After signup, show message: "Pendaftaran berhasil! Menunggu persetujuan admin."
- Remove the old phone-matching logic (replaced by direct creation)

## Step 4 — Update Login Flow (`src/pages/Login.tsx`)
- After login, if user is driver, check `approval_status`:
  - `pending` → show "Akun Anda sedang dalam proses review"
  - `rejected` → show "Pendaftaran ditolak: {reason}"
  - `approved` → proceed to `/driver`

## Step 5 — Protected Driver Route Update
- In `ProtectedDriverRoute.tsx`: fetch driver record, block access if `approval_status !== 'approved'`, show status message instead

## Step 6 — Driver Profile Completion (`src/pages/driver/DriverProfile.tsx`)
- Add file upload section for KTP, SIM, and profile photo
- Upload to `driver-documents/{user_id}/ktp.jpg`, `sim.jpg`, `photo.jpg`
- Save URLs back to `drivers` table
- Show upload status with preview thumbnails
- Allow re-upload

## Step 7 — Admin Driver Review (`src/pages/admin/DriversManagement.tsx`)
- Add tab/filter for "Pending Approval" drivers
- Show pending driver details (name, phone, email)
- Once approved: driver gets documents uploaded; admin can view KTP/SIM/photo
- Add Approve/Reject buttons with optional rejection reason
- Add vehicle assignment field (text input for plate/vehicle info) on the driver detail/edit dialog
- Update `DbDriver` interface in `use-supabase-data.ts` to include new columns

## Files Modified
- **Migrations**: 3 SQL migrations (columns, storage bucket, vehicle)
- `src/pages/Login.tsx` — signup creates driver record, login checks approval
- `src/pages/driver/DriverProfile.tsx` — fix Badge import + add document upload UI
- `src/components/driver/ProtectedDriverRoute.tsx` — block unapproved drivers
- `src/pages/admin/DriversManagement.tsx` — approval UI + vehicle assignment
- `src/hooks/use-supabase-data.ts` — update DbDriver interface

## Technical Details
- Storage uses folder-per-user pattern: `driver-documents/{user_id}/`
- RLS on storage ensures drivers can only upload to their own folder
- `approval_status` checked both at login and route guard level
- No new dependencies needed

