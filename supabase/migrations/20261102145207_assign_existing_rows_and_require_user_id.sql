-- Supabase MCP の apply_migration で適用済み（version: 20261102145207）。記録用に同じ内容を保存している

-- フェーズ1（認証なし）で登録したデータを、最初に登録した利用者（アプリの作者本人）のものにする
update public.categories
set user_id = (select id from auth.users order by created_at limit 1)
where user_id is null;

update public.questions
set user_id = (select id from auth.users order by created_at limit 1)
where user_id is null;

alter table public.categories alter column user_id set not null;
alter table public.questions alter column user_id set not null;
