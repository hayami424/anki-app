import { isDue } from "./schedule";

// 出題タイプ（要件 No.15）。スケジュールを進めるのは「今日の問題」だけで、他は練習として正誤判定のみ行う
export type ReviewMode = "today" | "all" | "category";

export type ReviewSelection =
  | { mode: "today" }
  | { mode: "all" }
  // categoryId が null のときはカテゴリーが未選択
  | { mode: "category"; categoryId: string | null };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// URL の検索パラメーターから出題タイプを読み取る。不明な値は「今日の問題」として扱う
export function parseReviewSelection(searchParams: {
  mode?: string | string[];
  categoryId?: string | string[];
}): ReviewSelection {
  const mode = firstValue(searchParams.mode);
  if (mode === "all") return { mode: "all" };
  if (mode === "category") {
    const categoryId = firstValue(searchParams.categoryId);
    return { mode: "category", categoryId: categoryId ? categoryId : null };
  }
  return { mode: "today" };
}

// 解答時に復習フェーズ・出題日を進めるか。mode はクライアントから届く値なので文字列として受け取る。
// 「今日の問題」でも、出題日を迎えていない問題（二重送信など）は進めない
export function shouldUpdateSchedule(
  mode: string,
  question: { nextReviewOn: string | null },
  today: string,
): boolean {
  return mode === "today" && isDue(question, today);
}
