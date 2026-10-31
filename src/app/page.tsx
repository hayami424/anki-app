import Link from "next/link";
import { Suspense } from "react";
import { QuestionList } from "@/components/QuestionList";
import { getCategories, getQuestions } from "@/lib/data/questions";
import { deleteQuestions } from "./questions/actions";

async function QuestionListLoader() {
  const [questions, categories] = await Promise.all([getQuestions(), getCategories()]);
  return (
    <QuestionList
      questions={questions}
      categories={categories}
      deleteQuestionsAction={deleteQuestions}
    />
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">問題一覧</h1>
        <nav className="flex gap-2">
          <Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/questions/new">
            問題作成
          </Link>
          <Link className="rounded bg-green-600 px-4 py-2 text-white" href="/review">
            復習
          </Link>
          <Link className="rounded border border-zinc-300 px-4 py-2" href="/categories">
            カテゴリー
          </Link>
        </nav>
      </div>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <QuestionListLoader />
      </Suspense>
    </main>
  );
}
