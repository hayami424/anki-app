-- Supabase MCP の apply_migration で適用済み（version: 20261031020506）。記録用に同じ内容を保存している

-- カテゴリー
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 50),
  created_at timestamptz not null default now()
);

-- 問題
-- review_phase: 1〜3 は復習待ち、4 は復習完了
-- next_review_on: 次に「今日の問題」として出題する日（日本時間）。復習完了時は null
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  question text not null check (char_length(btrim(question)) between 1 and 1000),
  answer text not null check (char_length(btrim(answer)) between 1 and 1000),
  url text check (url is null or url ~ '^https?://'),
  review_phase smallint not null default 1 check (review_phase between 1 and 4),
  next_review_on date default ((now() at time zone 'Asia/Tokyo')::date + 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_next_review_on_consistency
    check ((review_phase = 4) = (next_review_on is null))
);

create index questions_category_id_idx on public.questions (category_id);
create index questions_next_review_on_idx on public.questions (next_review_on);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

-- RLS
-- フェーズ1は認証なしのため、publishable キー（anon ロール）での読み書きを許可する。
-- フェーズ2で認証を導入する際に user_id 列を追加し、auth.uid() で絞り込むポリシーへ置き換えること。
alter table public.categories enable row level security;
alter table public.questions enable row level security;

create policy "anon can read categories" on public.categories
  for select to anon using (true);
create policy "anon can insert categories" on public.categories
  for insert to anon with check (true);

create policy "anon can read questions" on public.questions
  for select to anon using (true);
create policy "anon can insert questions" on public.questions
  for insert to anon with check (true);
create policy "anon can update questions" on public.questions
  for update to anon using (true) with check (true);
create policy "anon can delete questions" on public.questions
  for delete to anon using (true);
