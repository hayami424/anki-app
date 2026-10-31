import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuestionDetail } from "@/components/QuestionDetail";
import { getQuestion } from "@/lib/data/questions";
import { deleteQuestion } from "../actions";

async function QuestionDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) notFound();
  return <QuestionDetail question={question} deleteQuestionAction={deleteQuestion} />;
}

export default function QuestionDetailPage({ params }: PageProps<"/questions/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">問題詳細</h1>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <QuestionDetailLoader params={params} />
      </Suspense>
    </main>
  );
}
