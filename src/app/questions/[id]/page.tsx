import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="問題詳細" />
      <Suspense fallback={<LoadingCard />}>
        <QuestionDetailLoader params={params} />
      </Suspense>
    </main>
  );
}
