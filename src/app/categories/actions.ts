"use server";

import { refresh } from "next/cache";
import type { CategoryFormState } from "@/components/CategoryManager";
import { requireUser } from "@/lib/auth";
import { validateCategoryName } from "@/lib/validation";

// PostgreSQL の一意制約違反
const uniqueViolation = "23505";
// PostgreSQL の外部キー制約違反（問題が残っているカテゴリーを削除しようとした）
const foreignKeyViolation = "23503";

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const result = validateCategoryName(formData);
  const name = String(formData.get("name") ?? "");
  if (!result.ok) return { error: result.error, name };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").insert({ name: result.value });
  if (error) {
    return {
      error:
        error.code === uniqueViolation
          ? "同じ名前のカテゴリーが既に存在します"
          : "カテゴリーの登録に失敗しました",
      name,
    };
  }
  refresh();
  return {};
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const result = validateCategoryName(formData);
  const name = String(formData.get("name") ?? "");
  if (!result.ok) return { error: result.error, name };

  // 他人のカテゴリーの id を渡されても、RLS により更新対象が 0 件になるだけ
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ name: result.value })
    .eq("id", id);
  if (error) {
    return {
      error:
        error.code === uniqueViolation
          ? "同じ名前のカテゴリーが既に存在します"
          : "カテゴリーの修正に失敗しました",
      name,
    };
  }
  refresh();
  return {};
}

export async function deleteCategories(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0) return {};
  const { supabase } = await requireUser();
  // 1 文で削除するので、問題が残っているカテゴリーが 1 件でもあれば全体が取り消される
  const { error } = await supabase.from("categories").delete().in("id", ids);
  if (error) {
    return {
      error:
        error.code === foreignKeyViolation
          ? "問題が登録されているカテゴリーは削除できません。先に問題を削除するか、別のカテゴリーに移してください"
          : "カテゴリーの削除に失敗しました",
    };
  }
  refresh();
  return {};
}
