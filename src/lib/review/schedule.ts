import type { ReviewPhase } from "@/lib/types";

// 間違えたときに、回答日から次の出題までに空ける日数
const retryIntervalDays = { 1: 1, 2: 7, 3: 30 } as const;

// 正解して次のフェーズに進んだときに、作成日から次の出題までに空ける日数
const phaseStartDays = { 2: 7, 3: 30 } as const;

// 日付は日本時間の "YYYY-MM-DD" 文字列で扱う（文字列のまま大小比較できる）
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function toTokyoDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function isDue(
  question: { nextReviewOn: string | null },
  today: string,
): boolean {
  return question.nextReviewOn !== null && question.nextReviewOn <= today;
}

export function nextSchedule(
  current: { reviewPhase: ReviewPhase; createdOn: string },
  isCorrect: boolean,
  today: string,
): { reviewPhase: ReviewPhase; nextReviewOn: string | null } {
  const { reviewPhase, createdOn } = current;

  if (reviewPhase === 4) {
    return { reviewPhase: 4, nextReviewOn: null };
  }

  if (!isCorrect) {
    return {
      reviewPhase,
      nextReviewOn: addDays(today, retryIntervalDays[reviewPhase]),
    };
  }

  if (reviewPhase === 3) {
    return { reviewPhase: 4, nextReviewOn: null };
  }

  const nextPhase = (reviewPhase + 1) as 2 | 3;
  const scheduled = addDays(createdOn, phaseStartDays[nextPhase]);
  const tomorrow = addDays(today, 1);
  // 遅れて正解した場合でも、同じ日に再出題しないよう翌日以降にする
  return {
    reviewPhase: nextPhase,
    nextReviewOn: scheduled > tomorrow ? scheduled : tomorrow,
  };
}
