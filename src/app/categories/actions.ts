"use server";

import { refresh } from "next/cache";
import type { CategoryFormState } from "@/components/CategoryManager";
import { createClient } from "@/lib/supabase/server";
import { validateCategoryName } from "@/lib/validation";

// PostgreSQL の一意制約違反
const uniqueViolation = "23505";

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const result = validateCategoryName(formData);
  const name = String(formData.get("name") ?? "");
  if (!result.ok) return { error: result.error, name };

  const supabase = await createClient();
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
