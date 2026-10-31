import { checkSupabaseConnection } from "@/lib/supabase/checkConnection";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const result = await checkSupabaseConnection(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!result.ok) {
    console.error(`[Supabase] 接続に失敗しました: ${result.reason}`);
  }
}
