import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuestionForm } from "@/components/QuestionForm";
import { getCategories, getQuestion } from "@/lib/data/questions";
import { updateQuestion } from "../../actions";

async function EditQuestionForm({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const [question, categories] = await Promise.all([getQuestion(id), getCategories()]);
  if (!question) notFound();

  // 詳細画面から来た場合は詳細画面へ、一覧から来た場合は一覧へ戻す
  const returnToDetail = from === "detail";
  return (
    <QuestionForm
      categories={categories}
      action={updateQuestion.bind(null, id, returnToDetail)}
      initialValues={{
        categoryId: question.categoryId,
        question: question.question,
        answer: question.answer,
        url: question.url ?? "",
      }}
      submitLabel="修正"
      cancelHref={returnToDetail ? `/questions/${id}` : "/"}
    />
  );
}

export default function EditQuestionPage({
  params,
  searchParams,
}: PageProps<"/questions/[id]/edit">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">問題修正</h1>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <EditQuestionForm params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
