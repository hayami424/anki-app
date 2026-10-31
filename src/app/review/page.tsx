import { connection } from "next/server";
import { Suspense } from "react";
import { ReviewSession } from "@/components/ReviewSession";
import { getDueQuestions } from "@/lib/data/questions";
import { toTokyoDate } from "@/lib/review/schedule";
import { shuffle } from "@/lib/review/shuffle";
import { submitAnswer } from "./actions";

async function ReviewSessionLoader() {
  // 今日の日付と出題順はリクエストごとに決める
  await connection();
  const questions = await getDueQuestions(toTokyoDate(new Date()));
  const reviewQuestions = shuffle(questions).map(({ id, question, categoryName }) => ({
    id,
    question,
    categoryName,
  }));
  return <ReviewSession questions={reviewQuestions} submitAnswerAction={submitAnswer} />;
}

export default function ReviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">復習（今日の問題）</h1>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <ReviewSessionLoader />
      </Suspense>
    </main>
  );
}
