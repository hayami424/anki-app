import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { ResetOnNavigation } from "@/components/ResetOnNavigation";
import { ReviewSession } from "@/components/ReviewSession";
import {
  getCategories,
  getDueQuestions,
  getQuestion,
  getQuestions,
  getQuestionsByCategory,
} from "@/lib/data/questions";
import { parseReviewSelection, type ReviewSelection } from "@/lib/review/mode";
import { toTokyoDate } from "@/lib/review/schedule";
import { shuffle } from "@/lib/review/shuffle";
import type { Question } from "@/lib/types";
import { submitAnswer } from "./actions";

async function getReviewQuestions(selection: ReviewSelection): Promise<Question[]> {
  switch (selection.mode) {
    case "today":
      return getDueQuestions(toTokyoDate(new Date()));
    case "all":
      return getQuestions();
    case "category":
      return selection.categoryId === null ? [] : getQuestionsByCategory(selection.categoryId);
  }
}

// 問題修正画面から戻ってきたとき（?resume=問題ID）は、その問題を出題に含める。
// 「今日の問題」で解答済みなら出題日が進んで一覧から外れているが、やり直せるようにする（出題日は進まない）
async function withResumedQuestion(
  questions: Question[],
  resumeId: string | undefined,
): Promise<Question[]> {
  if (resumeId === undefined || questions.some((question) => question.id === resumeId)) {
    return questions;
  }
  const resumed = await getQuestion(resumeId);
  return resumed === null ? questions : [...questions, resumed];
}

async function ReviewSessionLoader({ searchParams }: Pick<PageProps<"/review">, "searchParams">) {
  const params = await searchParams;
  const selection = parseReviewSelection(params);
  const resumeId = typeof params.resume === "string" ? params.resume : undefined;
  // 今日の日付と出題順はリクエストごとに決める
  await connection();
  const [questions, categories] = await Promise.all([
    getReviewQuestions(selection).then((list) => withResumedQuestion(list, resumeId)),
    getCategories(),
  ]);
  const reviewQuestions = shuffle(questions).map(({ id, question, categoryName }) => ({
    id,
    question,
    categoryName,
  }));
  return (
    <ReviewSession
      // 出題タイプを切り替えたら、出題の進み具合を最初からにする
      key={JSON.stringify(selection)}
      questions={reviewQuestions}
      submitAnswerAction={submitAnswer.bind(null, selection.mode)}
      selection={selection}
      categories={categories}
      resumeQuestionId={resumeId}
    />
  );
}

export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader
        title="復習"
        description="今日の問題・全問復習・カテゴリー別から出題タイプを選んで解答しましょう"
      />
      {/* 一度開いた復習画面にもう一度来たとき（問題修正から戻ったときなど）、前回の進み具合ではなく
          読み込み表示から始める。Suspense の外側で作り直さないと、新しいデータが届くまで前回の状態が見える */}
      <ResetOnNavigation>
        <Suspense fallback={<LoadingCard />}>
          <ReviewSessionLoader searchParams={searchParams} />
        </Suspense>
      </ResetOnNavigation>
    </main>
  );
}
