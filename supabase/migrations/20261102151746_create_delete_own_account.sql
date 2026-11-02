-- Supabase MCP の apply_migration で適用済み（version: 20261102151746）。記録用に同じ内容を保存している

-- ログイン中の利用者が自分のアカウントを削除する（要件 No.5）。
-- auth.users は利用者の権限では消せないため security definer にし、消す対象は auth.uid() 本人に限る。
-- categories / questions は user_id の FK（on delete cascade）でまとめて削除される
-- get_advisors の「authenticated_security_definer_function_executable」はこの関数を利用者に呼ばせるためのもので想定どおり
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
