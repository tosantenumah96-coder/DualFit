# DualFit Development Roadmap

## Product Goal

DualFit should become a polished, reliable bodybuilding-first fitness app that connects nutrition, training, progress tracking, and coaching in one daily loop. The next phase should prioritize stability, clean data flow, habit retention, and strong core workflows before adding more advanced intelligence or automation.

## Executive Summary

The current direction is strong, but the app is already broad for a solo or small-team project. The biggest risk is not missing features. The biggest risk is scaling a prototype architecture before the daily user loop is fully stable.

The product should focus first on four things:

- Make food logging fast and trustworthy.
- Make workout logging reliable and smooth in the gym.
- Make My Program simple enough that users always know what to do today.
- Move critical user data into a proper backend with account support.

## Development Principles

- Ship one stable daily loop before expanding feature breadth.
- Keep one source of truth for each system.
- Prefer boring, relational backend architecture over clever client-only complexity.
- Use AI for interpretation and motivation before using it for automation.
- Design for repeated daily use, not just feature demos.

## Phase 1: Core MVP

### Goal

Make DualFit usable for a real user over 30 continuous days.

### Build First

- User accounts and cloud persistence
- Onboarding with goals and profile basics
- Reliable diary CRUD
- Reliable workout template builder and active workout flow
- Simple My Program scheduling using workout templates assigned to days
- Basic check-ins with weight and photos
- Useful dashboard focused on today
- AI coach as read-only insight, not autonomous controller

### MVP Scope

#### Accounts and Profile

- Email or magic-link auth
- User profile with age, sex, height, weight, goals, and activity level
- Calorie and macro target setup

#### Nutrition

- Search branded foods
- Search generic foods
- Keep FS Food Data as fallback
- Add, edit, move, and delete diary entries
- Meal totals and daily totals
- Favorite foods and recent foods
- Saved meals only if implementation is simple

#### Workouts

- Saved workout templates
- Create, edit, and delete templates
- Start workout from template or empty workout
- Add, edit, and delete exercises and sets
- Finish workout and save history
- Basic progression visibility using previous performance

#### My Program

- One active program
- Assign one saved workout template or rest to each day
- Today card and weekly calendar
- Start today’s workout from the program

#### Check-Ins

- Bodyweight
- Progress photos
- Date-based check-in history

#### Dashboard

- Today summary
- Calories and protein progress
- Workout status
- Check-in status
- Bodyweight trend
- One coach insight card

### MVP Features to Delay

- Deep adaptive programming
- Complex split-generation logic
- Advanced recovery logic
- Multi-week mesocycle automation
- Full wearable integrations
- Autonomous AI changes

## Phase 2: Post-MVP

### Goal

Turn DualFit from usable into sticky and habit-forming.

### Priority Features

- Weekly review and adherence summaries
- Better saved meal shortcuts
- Copy yesterday’s meals
- Exercise substitution tools
- Rest timer
- Workout notes
- Bodyweight trend explanations
- Better push reminders
- AI coach chat with real user context

### Retention Features

- Streaks for logging and training
- Daily reminders for food, workout, and check-in
- Weekly recap screen
- Positive reinforcement for target adherence
- Friction reducers such as repeat meals and repeat workouts

## Phase 3: Advanced / Future

### Goal

Differentiate DualFit with smarter coaching and better program adaptation.

### Future Features

- Adaptive calorie or macro recommendations
- Progress-photo comparison timeline
- Recovery-aware training suggestions
- Smarter progression engine
- Periodization templates
- Coach-led weekly plan suggestions
- Community or challenge features only if retention justifies them

## Recommended Dashboard Direction

### Core Rule

The dashboard should answer: What should I do today, and how am I doing?

### Recommended Structure

#### 1. Hero Today Card

- Calories consumed vs target
- Protein consumed vs target
- Workout scheduled or completed
- Check-in status
- Quick actions:
  - Log Food
  - Start Workout
  - Check In

#### 2. Daily Summary Row

- Calories
- Protein
- Workout
- Weight
- Sleep

Keep these small, scannable, and immediately readable.

#### 3. Progress Cards or Charts

- Bodyweight trend
- Calorie trend
- Workout consistency
- Sleep trend

Only one larger chart should dominate at a time.

#### 4. AI Coach Insight Card

Examples:

- Protein target missed 4 of the last 7 days.
- Weight trend is flat for 2 weeks.
- Training adherence is strong this week.

Add actions:

- Ask Coach
- See Why

#### 5. Quick Actions

- Add Food
- Start Workout
- Open My Program
- Log Check-In

## Recommended Workout Tab Direction

### Core Rule

The Workout tab should feel like a gym tool, not a settings page.

### Recommended Structure

#### 1. Today’s Workout Hero

- Today label
- Workout name
- Target muscles
- Exercise count
- Estimated duration
- Start Workout button
- Secondary action for edit or manage

#### 2. Quick Start

- Start Empty Workout
- Create Workout
- Saved Workouts

#### 3. My Program Preview

- Today
- Next session
- Weekly context

#### 4. Saved Workouts

- Compact cards
- Filters such as All, Custom, Recent
- Primary actions:
  - Start
  - Manage

#### 5. Workout History

- Recent sessions
- Duration
- Volume
- PR highlights

### Workout UX Priorities

- Fewer taps per set
- Large touch targets
- Fast previous-lift visibility
- Easy add and remove set actions
- Easy exercise substitution
- Clear finish-workout flow
- Reliable state persistence during session logging

## User-Friendly Features That Matter

### Nutrition

- Copy yesterday’s meals
- Frequent foods
- Recent foods
- Saved meals
- Better barcode reliability
- Quick add calories/macros

### Training

- Previous weight and reps shown clearly
- Duplicate last set
- Rest timer
- Simple PR callouts
- Suggested next weight when confidence is high

### Progress

- Weekly check-in reminder
- Weight trend summaries
- Photo compare
- Adherence summaries

### Onboarding and Personalization

- Ask goal first
- Ask experience level
- Ask training frequency
- Ask whether the user wants simple or advanced tracking

## Systems That Should Be Simplified Before Scaling

### 1. Custom Split Creation

Keep it focused on assigning workout templates to days. Do not make muscle-group-first setup the main path.

### 2. Program Logic

Program days should simply point to template IDs or rest. Avoid letting program logic directly mutate template data.

### 3. Template Builder

Use one shared Create Workout flow everywhere.

### 4. Dashboard Complexity

Do not turn the dashboard into a dense analytics surface before today’s actions are excellent.

### 5. AI Automation

Keep the AI coach advisory first. Require confirmation before changing anything meaningful.

## Backend Recommendation

### Best Option for a Small Team

Supabase is the best default stack.

### Why Supabase

- Built-in auth
- PostgreSQL data model
- Storage for check-in photos
- Row-level security
- Easier relational modeling than Firebase for workouts, programs, and diary entries
- Good fit for solo or small-team development

### Recommended Stack

- Frontend: Expo / React Native
- Backend: Supabase
- Database: Postgres
- Storage: Supabase Storage
- Server logic: Supabase Edge Functions or a small Node service
- AI proxy: small secure backend route or function

## Backend Option Comparison

### Supabase

- Best overall fit
- Best relational model
- Good auth and storage story

### Firebase

- Fast mobile setup
- Good real-time tools
- Harder to keep relational fitness data clean long term

### Custom Node/Express + Postgres

- Most control
- More work
- Better later if scale or product complexity demands it

## Local vs Server Data

### Keep Local

- Draft forms
- Draft active workout state
- Cached recent foods
- Cached recent workouts
- Optimistic changes waiting to sync
- UI preferences

### Keep on Server

- User profile
- Goals and targets
- Diary entries
- Saved foods and saved meals
- Workout templates
- Programs and assigned days
- Completed workouts
- Check-ins and photos
- Coach conversation history

## Recommended Database Structure

### Core Tables

- users
- profiles
- foods
- diary_entries
- workout_templates
- workout_template_exercises
- workout_template_sets
- exercises
- training_programs
- training_program_days
- completed_workouts
- completed_workout_exercises
- completed_workout_sets
- check_ins
- check_in_photos
- sleep_entries
- coach_threads
- coach_messages

### Data Model Principles

- Use immutable completed workout records
- Keep template data separate from active workout state
- Keep program assignments separate from template definitions
- Store nutrition entries as resolved values, not only external IDs

## AI Coach Recommendation

### Best Setup

Use a hybrid system:

- OpenAI API for response generation
- Rules layer for safety and permissions
- Retrieval/context builder for user data summaries

### What the Coach Should Use

- Calorie adherence
- Protein adherence
- Workout adherence
- Weight trend
- Check-ins
- Sleep
- Goal type
- Recent training performance

### What the Coach Should Do First

- Explain trends
- Highlight adherence issues
- Suggest actions
- Recommend optional plan adjustments
- Encourage consistency

### What the Coach Should Not Auto-Change

- Calories
- Macros
- Training split
- Program structure
- Check-in data

Every meaningful change should require user confirmation.

### Safety Limits

- No medical diagnosis
- No injury treatment advice
- No disordered-eating reinforcement
- No automatic destructive changes
- No unsupported health claims

## Competitive Differentiation

### Best Positioning

DualFit should be the app that combines bodybuilding nutrition, workout execution, and contextual coaching into one daily system.

### Realistic Differentiators

- Unified macros + workouts + check-ins + coaching
- Better daily “what do I do now?” clarity
- Stronger bodybuilding workflow than general fitness apps
- Cleaner premium design than spreadsheet-style apps
- More useful guidance than simple logging-only apps

### Avoid Trying to Copy Everyone

Do not try to out-Hevy Hevy and out-MyFitnessPal MyFitnessPal at the same time. Focus on a better connected loop instead.

## Design and UX Priorities

### Keep

- Dark mode
- Neon green accent
- Premium, serious, gym-forward look

### Improve

- One hero card per screen
- Stronger visual hierarchy
- Smaller, cleaner cards for secondary content
- More consistent buttons and interactions
- Better empty states
- Better loading and saving feedback
- Fewer stacked modal layers
- Faster and more subtle animations

## Recommended Build Order

### Sprint 1

- Refactor state boundaries
- Separate workout templates, active workouts, programs, and history more cleanly
- Stabilize diary CRUD
- Stabilize template builder

### Sprint 2

- Add Supabase auth
- Add profile persistence
- Move diary, templates, splits, and check-ins to cloud-backed persistence

### Sprint 3

- Tighten My Program
- Tighten Workout start and finish flows
- Improve Dashboard today loop

### Sprint 4

- Add coach insight layer
- Add weekly recap
- Add saved meal and repeat meal shortcuts

### Sprint 5 and Beyond

- Add progression recommendations
- Add adaptive suggestions
- Expand check-in and trend analysis

## Final Recommendation

Do not scale DualFit by adding more categories of features right now. Scale it by making the current loop feel inevitable:

- Open app
- See today
- Log food
- Do workout
- Check progress
- Get one useful coaching takeaway

If that loop feels fast, stable, and rewarding, the rest of the app will have a strong foundation.
