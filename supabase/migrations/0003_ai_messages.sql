-- AI guide chat history (per user). Run in Supabase SQL Editor.
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_idx on public.ai_messages (user_id, created_at);

alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_select" on public.ai_messages;
create policy "ai_messages_select" on public.ai_messages
  for select using (auth.uid() = user_id);
drop policy if exists "ai_messages_insert" on public.ai_messages;
create policy "ai_messages_insert" on public.ai_messages
  for insert with check (auth.uid() = user_id);
drop policy if exists "ai_messages_delete" on public.ai_messages;
create policy "ai_messages_delete" on public.ai_messages
  for delete using (auth.uid() = user_id);
