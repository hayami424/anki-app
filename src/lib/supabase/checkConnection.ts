export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

// Supabase Auth のヘルスチェックエンドポイントに問い合わせて、URL とキーが有効か確認する
export async function checkSupabaseConnection(
  url: string | undefined,
  publishableKey: string | undefined,
): Promise<ConnectionResult> {
  if (!url || !publishableKey) {
    return {
      ok: false,
      reason:
        "環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません",
    };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey },
    });
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    return { ok: true, url };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
