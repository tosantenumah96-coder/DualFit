-- DualFit MVP schema
-- Phase 1 backend foundation
-- Safe to rerun in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text default '',
  sex text default '',
  age integer,
  height text default '',
  weight_lbs text default '',
  goal_type text default '',
  target_calories integer,
  target_protein integer,
  target_carbs integer,
  target_fat integer,
  activity_level text default '',
  profile_photo_uri text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profiles
  add column if not exists profile_photo_uri text default '';

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id text not null,
  name text not null,
  order_index integer not null default 0,
  default_sets integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references public.workout_template_exercises(id) on delete cascade,
  set_number integer not null,
  set_type text not null default 'normal',
  weight text not null default '0',
  reps text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.training_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  split_type text not null default 'CUSTOM',
  split_length_weeks integer not null default 1,
  rest_days integer not null default 1,
  is_active boolean not null default false,
  is_customized_order boolean not null default false,
  is_manually_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  order_index integer not null,
  day_of_week integer not null,
  day_label text not null,
  full_day_label text not null,
  label text not null,
  workout_template_id uuid references public.workout_templates(id) on delete set null,
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  meal_type text not null,
  food_name text not null,
  brand text default '',
  source text default '',
  source_food_id text default '',
  serving_id text default '',
  unit_label text default '',
  amount numeric not null default 1,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  micros_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  weight_lbs numeric,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_in_photos (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_path text not null,
  photo_type text not null default 'other',
  created_at timestamptz not null default now()
);

create table if not exists public.completed_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  name text not null,
  date_key text not null,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer default 0,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.completed_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  completed_workout_id uuid not null references public.completed_workouts(id) on delete cascade,
  exercise_id text not null,
  name text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.completed_workout_sets (
  id uuid primary key default gen_random_uuid(),
  completed_workout_exercise_id uuid not null references public.completed_workout_exercises(id) on delete cascade,
  set_number integer not null,
  set_type text not null default 'normal',
  previous text not null default '--',
  weight text not null default '',
  reps text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table if exists public.profiles enable row level security;
alter table if exists public.workout_templates enable row level security;
alter table if exists public.workout_template_exercises enable row level security;
alter table if exists public.workout_template_sets enable row level security;
alter table if exists public.training_programs enable row level security;
alter table if exists public.training_program_days enable row level security;
alter table if exists public.diary_entries enable row level security;
alter table if exists public.check_ins enable row level security;
alter table if exists public.check_in_photos enable row level security;
alter table if exists public.completed_workouts enable row level security;
alter table if exists public.completed_workout_exercises enable row level security;
alter table if exists public.completed_workout_sets enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_templates own rows" on public.workout_templates;
create policy "workout_templates own rows" on public.workout_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "training_programs own rows" on public.training_programs;
create policy "training_programs own rows" on public.training_programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "diary_entries own rows" on public.diary_entries;
create policy "diary_entries own rows" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "check_ins own rows" on public.check_ins;
create policy "check_ins own rows" on public.check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "check_in_photos own rows" on public.check_in_photos;
create policy "check_in_photos own rows" on public.check_in_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "completed_workouts own rows" on public.completed_workouts;
create policy "completed_workouts own rows" on public.completed_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "template_exercises through template ownership" on public.workout_template_exercises;
create policy "template_exercises through template ownership" on public.workout_template_exercises
  for all using (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_templates wt
      where wt.id = template_id and wt.user_id = auth.uid()
    )
  );

drop policy if exists "template_sets through template exercise ownership" on public.workout_template_sets;
create policy "template_sets through template exercise ownership" on public.workout_template_sets
  for all using (
    exists (
      select 1
      from public.workout_template_exercises wte
      join public.workout_templates wt on wt.id = wte.template_id
      where wte.id = template_exercise_id and wt.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.workout_template_exercises wte
      join public.workout_templates wt on wt.id = wte.template_id
      where wte.id = template_exercise_id and wt.user_id = auth.uid()
    )
  );

drop policy if exists "training_program_days through program ownership" on public.training_program_days;
create policy "training_program_days through program ownership" on public.training_program_days
  for all using (
    exists (
      select 1 from public.training_programs tp
      where tp.id = program_id and tp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.training_programs tp
      where tp.id = program_id and tp.user_id = auth.uid()
    )
  );

drop policy if exists "completed_workout_exercises through workout ownership" on public.completed_workout_exercises;
create policy "completed_workout_exercises through workout ownership" on public.completed_workout_exercises
  for all using (
    exists (
      select 1 from public.completed_workouts cw
      where cw.id = completed_workout_id and cw.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.completed_workouts cw
      where cw.id = completed_workout_id and cw.user_id = auth.uid()
    )
  );

drop policy if exists "completed_workout_sets through completed exercise ownership" on public.completed_workout_sets;
create policy "completed_workout_sets through completed exercise ownership" on public.completed_workout_sets
  for all using (
    exists (
      select 1
      from public.completed_workout_exercises cwe
      join public.completed_workouts cw on cw.id = cwe.completed_workout_id
      where cwe.id = completed_workout_exercise_id and cw.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.completed_workout_exercises cwe
      join public.completed_workouts cw on cw.id = cwe.completed_workout_id
      where cwe.id = completed_workout_exercise_id and cw.user_id = auth.uid()
    )
  );
