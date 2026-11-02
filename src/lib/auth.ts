import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server Action の先頭で呼び、ログインしていなければログイン画面へ戻す。
// データは RLS で本人のものに絞られるが、未ログインの操作を早めに打ち切るために確認する
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub, claims: data.claims };
}

// メール内のリンクの戻り先。リンクは /auth/confirm で受けてから next の画面へ進める。
// "use server" のファイルに置くとクライアントから呼べる Server Action になってしまうため、ここに置く
export async function confirmUrl(next: string): Promise<string | undefined> {
  const origin = (await headers()).get("origin");
  // origin が取れない場合は Supabase に設定した Site URL が使われる
  return origin ? `${origin}/auth/confirm?next=${encodeURIComponent(next)}` : undefined;
}
