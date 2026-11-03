import type { ReviewQuestion } from "@/lib/types";

// 復習中に「問題修正」へ移動するときに保存し、戻ってきたら修正した問題から再開するための進み具合
export type SavedProgress = {
  // 出題タイプ（JSON 文字列）。違う出題タイプで戻ってきたら復元しない
  selectionKey: string;
  // 出題順（問題 ID）
  order: string[];
  // 修正しに行った問題の位置（0 始まり）
  index: number;
  // その問題より前の正解数（その問題に解答済みでも数えない。戻ったらやり直すため）
  correctCount: number;
};

export type RestoredProgress = {
  questions: ReviewQuestion[];
  index: number;
  correctCount: number;
};

export const progressStorageKey = "anki-app:review-progress";

export function parseSavedProgress(text: string | null): SavedProgress | null {
  if (text === null) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (
      typeof value === "object" &&
      value !== null &&
      "selectionKey" in value &&
      typeof value.selectionKey === "string" &&
      "order" in value &&
      Array.isArray(value.order) &&
      value.order.every((id: unknown) => typeof id === "string") &&
      "index" in value &&
      typeof value.index === "number" &&
      "correctCount" in value &&
      typeof value.correctCount === "number"
    ) {
      return {
        selectionKey: value.selectionKey,
        order: value.order,
        index: value.index,
        correctCount: value.correctCount,
      };
    }
  } catch {
    // 壊れた値は保存されていないものとして扱う
  }
  return null;
}

// 修正した問題（resumeId）から再開する出題を組み立てる。
// 保存した進み具合が使えればそれを引き継ぎ、使えなければ修正した問題を先頭にして最初から出題する
export function restoreProgress(
  saved: SavedProgress | null,
  selectionKey: string,
  questions: ReviewQuestion[],
  resumeId: string,
): RestoredProgress | null {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const resumed = byId.get(resumeId);
  if (resumed === undefined) return null;

  if (
    saved !== null &&
    saved.selectionKey === selectionKey &&
    saved.order[saved.index] === resumeId
  ) {
    // 解答済みの問題は出題日が進んで一覧から外れていることがあるが、もう表示しないので ID だけで埋める
    const done = saved.order
      .slice(0, saved.index)
      .map((id) => byId.get(id) ?? { id, question: "", categoryName: "" });
    // これから出題する問題は、削除されたものを除いて保存した順に並べる
    const remaining = saved.order
      .slice(saved.index)
      .flatMap((id) => {
        const question = byId.get(id);
        return question === undefined ? [] : [question];
      });
    return {
      questions: [...done, ...remaining],
      index: saved.index,
      correctCount: saved.correctCount,
    };
  }

  return {
    questions: [resumed, ...questions.filter((question) => question.id !== resumeId)],
    index: 0,
    correctCount: 0,
  };
}
