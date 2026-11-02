-- Supabase MCP の apply_migration で適用済み（version: 20261102144001）。記録用に同じ内容を保存している

-- 利用者ごとにデータを分ける。既存行の user_id は本人のアカウント作成後に埋めてから NOT NULL にする
alter table public.categories
  add column user_id uuid default auth.uid() references auth.users (id) on delete cascade;
alter table public.questions
  add column user_id uuid default auth.uid() references auth.users (id) on delete cascade;

create index categories_user_id_idx on public.categories (user_id);
create index questions_user_id_idx on public.questions (user_id);

-- カテゴリー名の重複は利用者ごとに判定する
alter table public.categories drop constraint categories_name_key;
alter table public.categories add constraint categories_user_id_name_key unique (user_id, name);

-- 問題は同じ利用者のカテゴリーだけを参照できるようにする（FK の確認は RLS を通らないため）
alter table public.categories add constraint categories_id_user_id_key unique (id, user_id);
alter table public.questions
  add constraint questions_category_id_user_id_fkey
  foreign key (category_id, user_id) references public.categories (id, user_id);

-- アカウント削除時に categories と questions が同じ文の中でまとめて消えるよう、
-- restrict（即時に確認）ではなく no action（文の終わりに確認）にする。問題が残るカテゴリーを消せない点は変わらない
alter table public.questions drop constraint questions_category_id_fkey;
alter table public.questions
  add constraint questions_category_id_fkey
  foreign key (category_id) references public.categories (id);

-- RLS: anon の全許可をやめ、ログイン中の利用者が自分の行だけを扱えるようにする
drop policy "anon can read categories" on public.categories;
drop policy "anon can insert categories" on public.categories;
drop policy "anon can read questions" on public.questions;
drop policy "anon can insert questions" on public.questions;
drop policy "anon can update questions" on public.questions;
drop policy "anon can delete questions" on public.questions;

create policy "users can read own categories" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can insert own categories" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users can update own categories" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users can delete own categories" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "users can read own questions" on public.questions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users can insert own questions" on public.questions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users can update own questions" on public.questions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users can delete own questions" on public.questions
  for delete to authenticated using ((select auth.uid()) = user_id);
