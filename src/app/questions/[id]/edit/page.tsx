import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { QuestionForm } from "@/components/QuestionForm";
import { ResetOnNavigation } from "@/components/ResetOnNavigation";
import { getCategories, getQuestion } from "@/lib/data/questions";
import { returnPath } from "@/lib/returnTo";
import { updateQuestion } from "../../actions";

async function EditQuestionForm({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, { from, mode, categoryId }] = await Promise.all([params, searchParams]);
  const [question, categories] = await Promise.all([getQuestion(id), getCategories()]);
  if (!question) notFound();

  // 一覧・詳細・復習のうち、来た画面へ戻す（?from=detail|review、復習なら出題タイプも引き継ぐ）
  const returnParams = { from, mode, categoryId };
  return (
    <QuestionForm
      categories={categories}
      action={updateQuestion.bind(null, id, returnParams)}
      initialValues={{
        categoryId: question.categoryId,
        question: question.question,
        answer: question.answer,
        url: question.url ?? "",
      }}
      submitLabel="修正"
      cancelHref={returnPath(id, returnParams)}
    />
  );
}

export default function EditQuestionPage({
  params,
  searchParams,
}: PageProps<"/questions/[id]/edit">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="問題修正" description="登録済みの問題を修正します" />
      {/* 一度開いた修正画面にもう一度来たとき、修正前の内容ではなく読み込み表示から始める */}
      <ResetOnNavigation>
        <Suspense fallback={<LoadingCard />}>
          <EditQuestionForm params={params} searchParams={searchParams} />
        </Suspense>
      </ResetOnNavigation>
    </main>
  );
}
