"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { QuestionFormState } from "@/components/QuestionForm";
import { createClient } from "@/lib/supabase/server";
import { validateQuestionInput, type QuestionInput } from "@/lib/validation";

// フェーズ1は認証なし。フェーズ2で認証を導入する際は、各アクションの先頭で利用者を確認すること

function saveFailed(input: QuestionInput): QuestionFormState {
  return {
    errors: { form: "問題の保存に失敗しました" },
    values: { ...input, url: input.url ?? "" },
  };
}

export async function createQuestion(
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const result = validateQuestionInput(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const supabase = await createClient();
  const { error } = await supabase.from("questions").insert({
    category_id: result.value.categoryId,
    question: result.value.question,
    answer: result.value.answer,
    url: result.value.url,
  });
  if (error) return saveFailed(result.value);
  redirect("/");
}

export async function updateQuestion(
  id: string,
  returnToDetail: boolean,
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const result = validateQuestionInput(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("questions")
    .update({
      category_id: result.value.categoryId,
      question: result.value.question,
      answer: result.value.answer,
      url: result.value.url,
    })
    .eq("id", id);
  if (error) return saveFailed(result.value);
  redirect(returnToDetail ? `/questions/${id}` : "/");
}

export async function deleteQuestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: "問題の削除に失敗しました" };
  redirect("/");
}

export async function deleteQuestions(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0) return {};
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().in("id", ids);
  if (error) return { error: "問題の削除に失敗しました" };
  refresh();
  return {};
}
