

# Google OAuth Role Selection Flow

## Problem Summary

When users sign up via Google OAuth, they bypass the role selection that email signup users see. The database trigger assigns a default role of `'consumer'`, and the user is immediately routed to the Consumer Dashboard without ever choosing their role.

## Solution Overview

Add an intermediate role selection step after Google OAuth sign-in for new users who haven't explicitly selected a role.

```text
Google Sign-in
     |
     v
Check: was role explicitly selected?
     |
     +---> NO  --> Redirect to /select-role
     |
     +---> YES --> Redirect to correct dashboard
```

---

## Implementation Plan

### 1. Database Change: Track Role Selection Source

Add a boolean column `role_selected` to the `profiles` table to distinguish between:
- Users who explicitly chose their role (email signup or role selection page) = `true`
- Users who received the default role (Google OAuth) = `false` or `null`

**SQL Migration:**
```sql
-- Add column to track if role was explicitly selected
ALTER TABLE public.profiles 
ADD COLUMN role_selected boolean DEFAULT false;

-- Update trigger to set role_selected based on whether role was provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, credits, cash, role, role_selected)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    0, 
    5000, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    -- role_selected is true if role was explicitly provided in metadata
    (NEW.raw_user_meta_data->>'role') IS NOT NULL
  );
  RETURN NEW;
END;
$$;
```

### 2. Create Role Selection Page

**New file: `src/pages/SelectRole.tsx`**

UI Design:
- Title: "How will you use SolarCredit?"
- Two prominent cards:
  - Producer card (sun icon): "I generate solar power"
  - Consumer card (house icon): "I use clean energy"
- Selecting a card updates the profile and redirects to the appropriate dashboard

Features:
- Protected route (requires authentication)
- Updates `profiles.role` and sets `role_selected = true`
- Shows loading state during update
- Redirects to Producer Dashboard (`/dashboard`) or Consumer Dashboard (`/consumer`)

### 3. Update App Routing

**Modify: `src/App.tsx`**
- Add new route: `/select-role` pointing to `SelectRole` component

### 4. Update Google OAuth Redirect Logic

**Modify: `src/pages/Auth.tsx`**
- After successful Google sign-in, redirect to `/` (home page)
- The home page will handle the role check

**Modify: `src/pages/Index.tsx`**
- Update the `checkRole` function to also check `role_selected`
- If authenticated user has `role_selected = false`, redirect to `/select-role`
- If `role_selected = true`, redirect to the appropriate dashboard

### 5. Update AppLayout for Dashboard Protection

**Modify: `src/components/layout/AppLayout.tsx`**
- Add check for `role_selected` status
- If user hasn't selected a role, redirect to `/select-role` before showing dashboard

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add `role_selected` column, update trigger |
| `src/pages/SelectRole.tsx` | Create | New role selection page with Producer/Consumer cards |
| `src/App.tsx` | Modify | Add `/select-role` route |
| `src/pages/Index.tsx` | Modify | Check `role_selected` and redirect appropriately |
| `src/components/layout/AppLayout.tsx` | Modify | Guard dashboards against users without role selection |

---

## User Flow After Implementation

### Email Signup Flow (unchanged):
1. User fills form, selects role (Producer/Consumer)
2. Role passed in metadata -> trigger sets `role_selected = true`
3. Verify email -> Login -> Correct dashboard

### Google OAuth Flow (new):
1. User clicks "Continue with Google"
2. Google authenticates -> profile created with `role_selected = false`
3. Redirect to `/select-role`
5. User chooses Producer or Consumer
6. Profile updated with `role_selected = true`
7. Redirect to correct dashboard

### Returning Google OAuth Users:
1. User signs in with Google
2. Ask for which account to be used
3. Profile already has `role_selected = true`
4. Direct redirect to their dashboard (no role selection shown)
5. If not it redirects to `/select-role`

---

## Technical Details

### SelectRole Page Component Structure:
```text
SelectRole
├── Auth check (redirect to /auth if not logged in)
├── Role check (redirect to dashboard if already selected)
├── UI
│   ├── Title: "How will you use SolarCredit?"
│   ├── Producer Card
│   │   ├── Sun icon
│   │   ├── "For Solar Producers"
│   │   └── Bullet points matching existing design
│   └── Consumer Card
│       ├── Diamond icon
│       ├── "For Consumers"
│       └── Bullet points matching existing design
└── Submit handler
    ├── Update profile (role, role_selected)
    └── Navigate to dashboard
```

### Database Query Pattern:
```typescript
// Check if role was selected
const { data } = await supabase
  .from('profiles')
  .select('role, role_selected')
  .eq('id', user.id)
  .maybeSingle();

if (!data?.role_selected) {
  navigate('/select-role');
} else if (data.role === 'producer') {
  navigate('/dashboard');
} else {
  navigate('/consumer');
}
```

