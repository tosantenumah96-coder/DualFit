# DualFit Supabase Setup

## Why Supabase

For DualFit MVP, Supabase is the simplest strong choice because it gives:

- Auth
- PostgreSQL
- Row-level security
- File storage for check-in photos
- SQL-first schema control

No separate server purchase is needed to start.

## What You Need To Create

Create a Supabase project and collect:

- Project URL
- Anon public key

These will be added to the local `.env` file.

## Environment Variables

Add these to `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The `EXPO_PUBLIC_` prefix is used because the mobile client needs these public values available at runtime.

## Data That Should Live In Supabase First

### First Wave

- user profile
- check-ins
- workout templates
- training splits / program days

### Second Wave

- diary entries
- completed workouts

## Storage

Create a storage bucket for check-in photos:

- bucket name: `check-in-photos`

Use per-user folder paths:

- `user-id/checkin-id/photo-name.jpg`

## Security

Enable row-level security on user-owned tables.

Policy pattern:

- user can only read their own rows
- user can only insert/update/delete their own rows

## Recommended Next Step After Setup

Once Supabase project credentials exist, the next implementation step in the app should be:

1. Add Supabase client config
2. Add sign-in / sign-up shell
3. Migrate profile and check-ins first
