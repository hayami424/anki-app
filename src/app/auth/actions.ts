"use server";

import { redirect } from "next/navigation";
import { confirmUrl } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "@/lib/types";
import {
  validateEmailInput,
  validateLogin,
  validateNewPassword,
  validateSignUp,
} from "@/lib/validation";

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = validateLogin(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.value);
  if (error) {
    const values = { name: "", email: result.value.email };
    if (error.code === "email_not_confirmed") {
      return {
        errors: { form: "メールアドレスの確認が済んでいません。確認メールのリンクを開いてください" },
        values,
      };
    }
    if (error.code === "invalid_credentials") {
      return { errors: { form: "メールアドレスまたはパスワードが正しくありません" }, values };
    }
    return { errors: { form: "ログインに失敗しました" }, values };
  }
  redirect("/");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = validateSignUp(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const { name, email, password } = result.value;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name }, emailRedirectTo: await confirmUrl("/") },
  });
  if (error) {
    return {
      errors: {
        form:
          error.code === "weak_password"
            ? "パスワードが条件を満たしていません"
            : "新規登録に失敗しました",
      },
      values: { name, email },
    };
  }
  // 登録済みのメールアドレスでも、他人の登録有無が分からないよう Supabase は成功として返す
  return { sent: true, values: { name, email } };
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = validateEmailInput(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(result.value.email, {
    redirectTo: await confirmUrl("/reset-password"),
  });
  if (error) {
    return {
      errors: { form: "再設定メールの送信に失敗しました" },
      values: { name: "", email: result.value.email },
    };
  }
  return { sent: true, values: { name: "", email: result.value.email } };
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = validateNewPassword(formData);
  if (!result.ok) return { errors: result.errors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: result.value.password });
  if (error) {
    return {
      errors: {
        form:
          error.code === "same_password"
            ? "現在と同じパスワードは設定できません"
            : "パスワードの変更に失敗しました",
      },
    };
  }
  redirect("/");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
