

# Add Logout Button

## Changes

### 1. Admin Layout Header (`src/components/admin/AdminLayout.tsx`)
- Import `useAuth` and `LogOut` icon
- Add a logout button to the right side of the admin header bar
- On click, call `signOut()` then navigate to `/login`

### 2. Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Add a logout button at the bottom of the sidebar for when sidebar is expanded

No database changes needed.

