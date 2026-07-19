-- ============================================================
-- Hunar migration 0004 — notifications, payments/escrow, reviews,
-- verified/portfolio, sounds (music), and video views (analytics)
-- Run this in Supabase SQL Editor (safe to re-run).
-- ============================================================

-- ---------- profiles: verified badge + admin flag ----------
alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- ---------- portfolio items ----------
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  link text,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_user_idx on public.portfolio_items (user_id, created_at desc);

-- ---------- reviews / ratings ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (reviewer_id, reviewee_id)
);
create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,      -- recipient
  actor_id uuid references public.profiles (id) on delete cascade,              -- who caused it
  type text not null check (type in ('like','comment','follow','message','payment','review','system')),
  video_id uuid references public.videos (id) on delete cascade,
  text text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- sounds (music library + sounds pulled from videos) ----------
create table if not exists public.sounds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  audio_url text,
  cover_url text,
  duration numeric,
  source_video_id uuid references public.videos (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists sounds_title_idx on public.sounds (title);

-- videos: link a sound
alter table public.videos add column if not exists sound_id uuid references public.sounds (id) on delete set null;

-- ---------- payments / manual escrow ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,    -- payer
  worker_id uuid not null references public.profiles (id) on delete cascade,    -- payee
  skill_post_id uuid references public.skill_posts (id) on delete set null,
  amount numeric not null,
  method text not null default 'jazzcash' check (method in ('jazzcash','easypaisa','telenor','bank','other')),
  screenshot_url text,
  note text,
  status text not null default 'submitted' check (status in ('submitted','held','released','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_worker_idx on public.payments (worker_id, created_at desc);
create index if not exists payments_client_idx on public.payments (client_id, created_at desc);

-- ---------- video views (analytics) ----------
create table if not exists public.video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists video_views_video_idx on public.video_views (video_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.portfolio_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.sounds enable row level security;
alter table public.payments enable row level security;
alter table public.video_views enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- portfolio: public read, owner writes
drop policy if exists "portfolio_select" on public.portfolio_items;
create policy "portfolio_select" on public.portfolio_items for select using (true);
drop policy if exists "portfolio_insert" on public.portfolio_items;
create policy "portfolio_insert" on public.portfolio_items for insert with check (auth.uid() = user_id);
drop policy if exists "portfolio_update" on public.portfolio_items;
create policy "portfolio_update" on public.portfolio_items for update using (auth.uid() = user_id);
drop policy if exists "portfolio_delete" on public.portfolio_items;
create policy "portfolio_delete" on public.portfolio_items for delete using (auth.uid() = user_id);

-- reviews: public read, reviewer writes/updates/deletes own
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews for select using (true);
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() = reviewer_id and reviewer_id <> reviewee_id);
drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews for update using (auth.uid() = reviewer_id);
drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews for delete using (auth.uid() = reviewer_id);

-- notifications: recipient reads/updates/deletes; anyone auth can create for others
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert with check (auth.uid() = actor_id or actor_id is null);
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications for delete using (auth.uid() = user_id);

-- sounds: public read, any authenticated user can add
drop policy if exists "sounds_select" on public.sounds;
create policy "sounds_select" on public.sounds for select using (true);
drop policy if exists "sounds_insert" on public.sounds;
create policy "sounds_insert" on public.sounds for insert with check (auth.uid() is not null);
drop policy if exists "sounds_update" on public.sounds;
create policy "sounds_update" on public.sounds for update using (auth.uid() is not null);

-- payments: participants or admin can read; client creates; participants/admin update status
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (auth.uid() = client_id or auth.uid() = worker_id or public.is_admin());
drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments
  for insert with check (auth.uid() = client_id);
drop policy if exists "payments_update" on public.payments;
create policy "payments_update" on public.payments
  for update using (auth.uid() = client_id or auth.uid() = worker_id or public.is_admin());

-- video_views: anyone authenticated can insert; public read (for counts)
drop policy if exists "video_views_select" on public.video_views;
create policy "video_views_select" on public.video_views for select using (true);
drop policy if exists "video_views_insert" on public.video_views;
create policy "video_views_insert" on public.video_views for insert with check (true);

-- ============================================================
-- Realtime for notifications (live bell)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ============================================================
-- OPTIONAL: make yourself the admin (replace the username).
-- Admin can see all payment/escrow records in the app.
--   update public.profiles set is_admin = true where username = 'YOUR_USERNAME';
-- ============================================================
