"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { QuestionFormState } from "@/components/QuestionForm";
import { requireUser } from "@/lib/auth";
import { returnPath } from "@/lib/returnTo";
import { validateQuestionInput, type QuestionInput } from "@/lib/validation";

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

  const { supabase } = await requireUser();
  const { error } = await supabase.from("questions").insert({
    category_id: result.value.categoryId,
    question: result.value.question,
    answer: result.value.answer,
    url: result.value.url,
  });
  if (error) return saveFailed(result.value);
  redirect("/");
}

// returnParams は修正画面の URL の from / mode / categoryId。.bind で渡すため書き換えられるが、
// 戻り先のパスは returnPath() がアプリ内の決まった画面だけから組み立てる
export async function updateQuestion(
  id: string,
  returnParams: Record<string, string | string[] | undefined>,
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const result = validateQuestionInput(formData);
  if (!result.ok) return { errors: result.errors, values: result.values };

  const { supabase } = await requireUser();
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
  redirect(returnPath(id, returnParams));
}

export async function deleteQuestion(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: "問題の削除に失敗しました" };
  redirect("/");
}

export async function deleteQuestions(ids: string[]): Promise<{ error?: string }> {
  if (ids.length === 0) return {};
  const { supabase } = await requireUser();
  const { error } = await supabase.from("questions").delete().in("id", ids);
  if (error) return { error: "問題の削除に失敗しました" };
  refresh();
  return {};
}
