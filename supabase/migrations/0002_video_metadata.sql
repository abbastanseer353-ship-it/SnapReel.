-- Adds creator metadata columns to videos.
-- Run this in the Supabase SQL Editor if you already applied schema.sql before
-- this migration existed. Safe to run multiple times.

alter table public.videos add column if not exists music text;
alter table public.videos add column if not exists link text;
alter table public.videos add column if not exists location text;
alter table public.videos add column if not exists visibility text not null default 'public';
alter table public.videos add column if not exists allow_comments boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'videos_visibility_check'
  ) then
    alter table public.videos
      add constraint videos_visibility_check
      check (visibility in ('public', 'followers'));
  end if;
end $$;
