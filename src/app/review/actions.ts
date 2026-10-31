"use server";

import type { SubmitAnswerResult } from "@/components/ReviewSession";
import { isCorrectAnswer } from "@/lib/review/judge";
import { isDue, nextSchedule, toTokyoDate } from "@/lib/review/schedule";
import { createClient } from "@/lib/supabase/server";
import type { ReviewPhase } from "@/lib/types";

export async function submitAnswer(
  id: string,
  userAnswer: string,
): Promise<SubmitAnswerResult> {
  const supabase = await createClient();
  const { data: question, error } = await supabase
    .from("questions")
    .select("answer, review_phase, next_review_on, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !question) return { error: "解答の送信に失敗しました" };

  const isCorrect = isCorrectAnswer(userAnswer, question.answer);
  const today = toTokyoDate(new Date());

  // 二重送信などで出題日を迎えていない問題のスケジュールを進めないようにする
  if (isDue({ nextReviewOn: question.next_review_on }, today)) {
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
