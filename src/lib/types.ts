import type { AuthFieldErrors, AuthFormValues } from "@/lib/validation";

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

// 認証まわりのフォーム（ログイン・新規登録・パスワード再設定）の送信結果
export type AuthFormState = {
  errors?: AuthFieldErrors & { form?: string };
  values?: AuthFormValues;
  // 確認メール・再設定メールを送信できたとき true
  sent?: boolean;
};
