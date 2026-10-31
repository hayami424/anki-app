// 1〜3 は復習待ち、4 は復習完了
export type ReviewPhase = 1 | 2 | 3 | 4;

export type Category = {
  id: string;
  name: string;
};

export type Question = {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  answer: string;
  url: string | null;
  reviewPhase: ReviewPhase;
  // 次に「今日の問題」として出題する日（日本時間, YYYY-MM-DD）。復習完了時は null
  nextReviewOn: string | null;
  createdAt: string;
  // 作成日（日本時間, YYYY-MM-DD）
  createdOn: string;
};

// 復習画面に渡す問題。解答はサーバー側で判定するためクライアントには渡さない
export type ReviewQuestion = {
  id: string;
  question: string;
  categoryName: string;
};
