import {
  parseReviewSelection,
  reviewSearchParams,
  type ReviewSelection,
} from "@/lib/review/mode";

// 問題修正画面の戻り先（画面遷移図: 一覧 ⑪⑫、詳細 ⑰⑱、復習 ⑯⑮）。
// URL の from / mode / categoryId から決め、戻り先のパスはここで組み立てる（受け取った URL はそのまま使わない）
type ReturnParams = {
  from?: string | string[];
  mode?: string | string[];
  categoryId?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function withSearch(path: string, search: string): string {
  return search === "" ? path : `${path}?${search}`;
}

// 問題修正画面の「戻る」と、修正後の移動先
export function returnPath(questionId: string, params: ReturnParams): string {
  const from = firstValue(params.from);
  if (from === "detail") return `/questions/${encodeURIComponent(questionId)}`;
  if (from === "review") {
    // resume: 修正した問題から復習を再開する（src/lib/review/progress.ts）
    const search = new URLSearchParams(reviewSearchParams(parseReviewSelection(params)));
    search.set("resume", questionId);
    return withSearch("/review", search.toString());
  }
  return "/";
}

// 復習画面から問題修正画面へのリンク。戻ってきたときに同じ出題タイプで復習できるよう引き継ぐ
export function editFromReviewHref(questionId: string, selection: ReviewSelection): string {
  const params = new URLSearchParams(reviewSearchParams(selection));
  params.set("from", "review");
  return `/questions/${encodeURIComponent(questionId)}/edit?${params.toString()}`;
}
