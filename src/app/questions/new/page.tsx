import { Suspense } from "react";
import { QuestionForm } from "@/components/QuestionForm";
import { getCategories } from "@/lib/data/questions";
import { createQuestion } from "../actions";

async function NewQuestionForm() {
  const categories = await getCategories();
  return (
    <QuestionForm
      categories={categories}
      action={createQuestion}
      submitLabel="作成"
      cancelHref="/"
    />
  );
}

export default function NewQuestionPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">問題作成</h1>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <NewQuestionForm />
      </Suspense>
    </main>
  );
}
