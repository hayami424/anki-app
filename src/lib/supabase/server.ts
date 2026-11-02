import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";

export async function createClient() {
  // Supabase はトークンの有効期限を Date.now() と比べるため、事前描画（cookies() を読む部分も含む）
  // ではなくリクエスト時に実行する。データは利用者ごとでキャッシュしていないので描画結果は変わらない
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component から呼ばれた場合は cookie を書き込めないため無視する
          }
        },
      },
    },
  );
}
