import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { ReviewSession } from "@/components/ReviewSession";
import {
  getCategories,
  getDueQuestions,
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

async function ReviewSessionLoader({ searchParams }: Pick<PageProps<"/review">, "searchParams">) {
  const selection = parseReviewSelection(await searchParams);
  // 今日の日付と出題順はリクエストごとに決める
  await connection();
  const [questions, categories] = await Promise.all([
    getReviewQuestions(selection),
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
      <Suspense fallback={<LoadingCard />}>
        <ReviewSessionLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
