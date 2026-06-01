# DualFit Phase 1 MVP Execution Plan

## Objective

Phase 1 turns DualFit from a promising prototype into a usable MVP with:

- real user accounts
- cloud-backed persistence
- stable nutrition logging
- stable workout logging
- simple program scheduling
- reliable check-ins

AI coaching is intentionally deferred until Phase 2.

## Recommended Tech Direction

- Frontend: Expo / React Native
- Backend: Supabase
- Database: PostgreSQL via Supabase
- File storage: Supabase Storage
- Existing local FatSecret proxy remains in place

## Why This Phase Starts Here

The app already has:

- food diary logic
- saved workouts
- active workout logging
- custom splits / program scheduling
- check-ins
- dashboard summaries

What it does not yet have is a durable backend foundation. Right now, core user data is still stored in local AsyncStorage. That is acceptable for prototyping, but not for a real MVP.

## Phase 1 Deliverables

### 1. Backend Foundation

- Supabase project created
- environment variables wired
- SQL schema applied
- storage bucket created for check-in photos
- row-level security policies enabled

### 2. Auth

- sign up
- sign in
- sign out
- session restore
- onboarding gate for first-time users

### 3. Data Migration Layer

- keep AsyncStorage as local cache/draft layer only
- cloud becomes source of truth
- initial hydration from backend
- safe fallback if user is offline

### 4. MVP Core Flows

- food diary CRUD is stable
- workout templates CRUD is stable
- start / complete workout is stable
- program assignment to days is stable
- check-ins persist with photos

## Build Order

### Step 1. Add Supabase Project Config

Goal:

- prepare the app for cloud-backed identity and persistence

Tasks:

- add Supabase URL and anon key placeholders to `.env.example`
- create setup notes for local environment
- keep existing FatSecret env values intact

Success criteria:

- local devs know exactly what env values are required
- no current local-only flows break

### Step 2. Create Database Schema

Goal:

- establish stable relational data model before wiring UI to backend

Tables to create first:

- profiles
- workout_templates
- workout_template_exercises
- workout_template_sets
- training_programs
- training_program_days
- diary_entries
- check_ins
- check_in_photos
- completed_workouts
- completed_workout_exercises
- completed_workout_sets

Success criteria:

- schema is expressive enough for current app flows
- no critical feature depends on denormalized hacks

### Step 3. Add Auth Shell

Goal:

- let users create accounts and restore data across devices

Tasks:

- add sign-in screen
- add sign-up screen
- add session restore
- gate main app behind auth when enabled

Success criteria:

- user can create account and return later
- app remembers signed-in state

### Step 4. Move Profile and Check-Ins to Backend

Goal:

- migrate lowest-risk user data first

Tasks:

- sync `userProfile`
- sync `checkIns`
- upload photo URIs to storage and store public/private paths

Success criteria:

- user profile loads from server
- check-ins persist across reinstall/device

### Step 5. Move Workout Templates and Programs to Backend

Goal:

- stabilize the workout side before more UI expansion

Tasks:

- sync saved workouts
- sync template exercises and sets
- sync training splits / program days
- sync active split selection

Success criteria:

- workout templates survive reinstall
- program assignment is account-specific
- custom split edits persist

### Step 6. Move Diary to Backend

Goal:

- stabilize the daily logging loop

Tasks:

- sync diary entries by date
- keep current food search sources
- preserve current macro calculations
- keep local optimistic UI

Success criteria:

- user can log food on one device and see it on another
- editing entries updates totals correctly

### Step 7. Move Workout History to Backend

Goal:

- persist long-term training history for progression and future coach use

Tasks:

- sync completed workouts
- sync completed exercises and sets
- preserve timestamps and duration

Success criteria:

- previous performance survives reinstall/device
- workout history becomes reliable source for progression and coach analysis later

## Simplifications That Should Happen During Phase 1

### Keep Program Logic Simple

- program day = template id or rest
- avoid further expansion of split-generation complexity during MVP

### Keep Food Logging Fast

- optimize recent foods, favorites, repeat meals
- do not expand too far into advanced food editing yet

### Keep Workout Builder Unified

- one shared Create Workout flow
- one shared exercise picker
- one shared template set structure

### Keep Check-Ins Minimal

- weight
- date
- optional photos

No advanced coach interpretation yet.

## Product Priorities Inside Phase 1

### Highest Priority

- auth
- persistence
- no crash paths
- fast food add flow
- fast workout start/log/finish flow
- stable program day assignment

### Medium Priority

- dashboard cleanup
- stronger empty states
- better local caching
- push-notification planning

### Lower Priority

- more charts
- deeper program automation
- advanced progression logic

## QA Checklist For Phase 1

### Food Diary

- add food
- edit food
- move meal
- delete food
- totals recalculate
- persistence survives reload

### Workout Templates

- create template
- add exercises
- add sets
- edit reps and weight
- save template
- delete template

### Active Workout

- start workout
- add exercise
- edit sets
- finish workout
- save history

### My Program

- assign template to day
- assign rest day
- save custom split
- reopen and verify assignments

### Check-Ins

- save weight
- upload photo
- reload and verify persistence

## Phase 1 Definition of Done

DualFit can be considered Phase 1 complete when:

- users can sign in
- their data loads from the backend
- they can log meals daily
- they can start and finish workouts
- they can manage saved workouts
- they can assign workouts to program days
- they can save check-ins
- their data survives reinstall and device changes
- the app has no major crash paths in Diary, Workout, or My Program

## Human Input Needed Next

To continue implementation, the next real blocker is backend setup:

- create a Supabase project
- provide:
  - project URL
  - anon public key

No server purchase is required yet if we use Supabase.
