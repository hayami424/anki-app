import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server Action の先頭で呼び、ログインしていなければログイン画面へ戻す。
// データは RLS で本人のものに絞られるが、未ログインの操作を早めに打ち切るために確認する
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return { supabase, userId: data.claims.sub };
}
