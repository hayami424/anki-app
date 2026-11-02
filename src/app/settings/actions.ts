"use server";

import type { UserAttributes } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { SettingsFormState } from "@/components/SettingsForm";
import { confirmUrl, requireUser } from "@/lib/auth";
import { validateProfile } from "@/lib/validation";

export async function updateProfile(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { supabase, claims } = await requireUser();
  const result = validateProfile(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const { name, email, password } = result.value;
  // 変更前のメールアドレスはクライアントから受け取らず、サーバーのセッションから取る
  const currentEmail = claims.email ?? "";
  const emailChanged = email !== currentEmail;

  const attributes: UserAttributes = { data: { display_name: name } };
  if (emailChanged) attributes.email = email;
  if (password !== null) attributes.password = password;

  const { error } = await supabase.auth.updateUser(attributes, {
    emailRedirectTo: await confirmUrl("/settings"),
  });
  if (error) {
    const values = { name, email };
    switch (error.code) {
      case "email_exists":
        return { errors: { email: "このメールアドレスは既に使われています" }, values };
      case "same_password":
        return { errors: { password: "現在と同じパスワードは設定できません" }, values };
      case "weak_password":
        return { errors: { password: "パスワードが条件を満たしていません" }, values };
      case "reauthentication_needed":
        return {
          errors: { form: "パスワードを変更するには、一度ログアウトしてから再度ログインしてください" },
          values,
        };
      default:
        return { errors: { form: "個人設定の保存に失敗しました" }, values };
    }
  }

  // ヘッダーなどの名前はアクセストークン（JWT）の user_metadata から読んでいる。
  // updateUser ではトークンが作り直されないため、発行し直してから画面を再描画する
  await supabase.auth.refreshSession();
  refresh();
  return {
    // メールアドレスは確認リンクを開くまで変わらないため、変更前のものを表示する
    values: { name, email: currentEmail },
    notice: emailChanged
      ? // Supabase の既定（Secure email change）では新旧両方のアドレスに確認メールが届く
        "保存しました。確認メールを送信したので、メール内のリンクを開くとメールアドレスの変更が完了します"
      : "保存しました",
  };
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { error: "アカウントの削除に失敗しました" };

  // アカウントはもう存在しないので、Supabase には問い合わせずに手元の cookie だけ消す
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
