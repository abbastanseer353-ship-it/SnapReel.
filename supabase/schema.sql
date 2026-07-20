-- ============================================================
-- Hunar database schema (run in Supabase SQL Editor)
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'both' check (role in ('client', 'worker', 'both')),
  skills text[],
  created_at timestamptz not null default now()
);

-- ---------- videos ----------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_url text not null,
  thumbnail_url text,
  caption text,
  music text,
  link text,
  location text,
  visibility text not null default 'public' check (visibility in ('public', 'followers')),
  allow_comments boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists videos_user_id_idx on public.videos (user_id);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

-- ---------- likes ----------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

-- ---------- comments ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_video_id_idx on public.comments (video_id);

-- ---------- follows ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- ---------- skill_posts (Earning) ----------
create table if not exists public.skill_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  budget numeric,
  post_type text not null default 'offer' check (post_type in ('offer', 'request')),
  created_at timestamptz not null default now()
);
create index if not exists skill_posts_created_at_idx on public.skill_posts (created_at desc);

-- ---------- messages (chat) ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at);

-- ---------- ai_messages (profile AI guide) ----------
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_idx on public.ai_messages (user_id, created_at);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.skill_posts enable row level security;
alter table public.messages enable row level security;
alter table public.ai_messages enable row level security;

-- profiles: readable by everyone, writable by owner
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- videos: readable by everyone, owner writes
drop policy if exists "videos_select" on public.videos;
create policy "videos_select" on public.videos for select using (true);
drop policy if exists "videos_insert" on public.videos;
create policy "videos_insert" on public.videos for insert with check (auth.uid() = user_id);
drop policy if exists "videos_delete" on public.videos;
create policy "videos_delete" on public.videos for delete using (auth.uid() = user_id);

-- likes
drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes for select using (true);
drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes for delete using (auth.uid() = user_id);

-- comments
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select using (true);
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

-- follows
drop policy if exists "follows_select" on public.follows;
create policy "follows_select" on public.follows for select using (true);
drop policy if exists "follows_insert" on public.follows;
create policy "follows_insert" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "follows_delete" on public.follows;
create policy "follows_delete" on public.follows for delete using (auth.uid() = follower_id);

-- skill_posts
drop policy if exists "skill_posts_select" on public.skill_posts;
create policy "skill_posts_select" on public.skill_posts for select using (true);
drop policy if exists "skill_posts_insert" on public.skill_posts;
create policy "skill_posts_insert" on public.skill_posts for insert with check (auth.uid() = user_id);
drop policy if exists "skill_posts_delete" on public.skill_posts;
create policy "skill_posts_delete" on public.skill_posts for delete using (auth.uid() = user_id);

-- messages: only participants can read; only sender can insert
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ai_messages: private to the owner
drop policy if exists "ai_messages_select" on public.ai_messages;
create policy "ai_messages_select" on public.ai_messages
  for select using (auth.uid() = user_id);
drop policy if exists "ai_messages_insert" on public.ai_messages;
create policy "ai_messages_insert" on public.ai_messages
  for insert with check (auth.uid() = user_id);
drop policy if exists "ai_messages_delete" on public.ai_messages;
create policy "ai_messages_delete" on public.ai_messages
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Realtime for chat
-- ============================================================
alter publication supabase_realtime add table public.messages;
