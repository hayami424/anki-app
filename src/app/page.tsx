import { BrainCircuit, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { QuestionList } from "@/components/QuestionList";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader
        title="問題一覧"
        description="登録した問題の確認・絞り込み・削除ができます"
        actions={
          <nav className="flex flex-wrap gap-2">
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/categories">
              <FolderOpen />
              カテゴリー
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/questions/new">
              <Plus />
              問題作成
            </Link>
            <Link className={cn(buttonVariants({ size: "lg" }))} href="/review">
              <BrainCircuit />
              復習
            </Link>
          </nav>
        }
      />
      <Suspense fallback={<LoadingCard />}>
        <QuestionListLoader />
      </Suspense>
    </main>
  );
}
