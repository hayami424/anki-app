"use server";

import type { SubmitAnswerResult } from "@/components/ReviewSession";
import { isCorrectAnswer } from "@/lib/review/judge";
import { shouldUpdateSchedule } from "@/lib/review/mode";
import { nextSchedule, toTokyoDate } from "@/lib/review/schedule";
import { requireUser } from "@/lib/auth";
import type { ReviewPhase } from "@/lib/types";

// mode はページで .bind して渡す出題タイプ。クライアントから書き換えられても、
// 出題日を迎えていない問題のスケジュールは shouldUpdateSchedule が進めない
export async function submitAnswer(
  mode: string,
  id: string,
  userAnswer: string,
): Promise<SubmitAnswerResult> {
  const { supabase } = await requireUser();
  const { data: question, error } = await supabase
    .from("questions")
    .select("answer, review_phase, next_review_on, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !question) return { error: "解答の送信に失敗しました" };

  const isCorrect = isCorrectAnswer(userAnswer, question.answer);
  const today = toTokyoDate(new Date());

  // 全問復習・カテゴリー別は練習なので進めない。二重送信などで出題日を迎えていない問題も進めない
  if (shouldUpdateSchedule(mode, { nextReviewOn: question.next_review_on }, today)) {
    const schedule = nextSchedule(
      {
        reviewPhase: question.review_phase as ReviewPhase,
        createdOn: toTokyoDate(new Date(question.created_at)),
      },
      isCorrect,
      today,
    );
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        review_phase: schedule.reviewPhase,
        next_review_on: schedule.nextReviewOn,
      })
      .eq("id", id);
    if (updateError) return { error: "解答の送信に失敗しました" };
  }

  return { isCorrect, correctAnswer: question.answer };
}
