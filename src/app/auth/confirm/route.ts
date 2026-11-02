import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safeNextPath";
import { createClient } from "@/lib/supabase/server";

// 確認メール・パスワード再設定メールのリンクの受け口。
// メールテンプレートを token_hash 形式にした場合（別の端末で開いても使える）と、
// 既定のテンプレート（code が付いて戻ってくる。同じブラウザでのみ使える）の両方に対応する
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  redirect("/auth/error");
}
