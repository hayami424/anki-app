import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { QuestionForm } from "@/components/QuestionForm";
import { ResetOnNavigation } from "@/components/ResetOnNavigation";
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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="問題作成" description="新しい問題と解答を登録します" />
      {/* 一度開いた作成画面にもう一度来たとき、前回の入力やカテゴリー一覧ではなく読み込み表示から始める */}
      <ResetOnNavigation>
        <Suspense fallback={<LoadingCard />}>
          <NewQuestionForm />
        </Suspense>
      </ResetOnNavigation>
    </main>
  );
}
