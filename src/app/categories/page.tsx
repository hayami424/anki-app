import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { CategoryManager } from "@/components/CategoryManager";
import { ResetOnNavigation } from "@/components/ResetOnNavigation";
import { getCategorySummaries } from "@/lib/data/questions";
import { createCategory, deleteCategories, updateCategory } from "./actions";

async function CategoryManagerLoader() {
  const categories = await getCategorySummaries();
  return (
    <CategoryManager
      categories={categories}
      createCategoryAction={createCategory}
      updateCategoryAction={updateCategory}
      deleteCategoriesAction={deleteCategories}
    />
  );
}

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="カテゴリー一覧" description="問題を分類するカテゴリーを登録・修正・削除します" />
      {/* 一度開いたカテゴリー一覧にもう一度来たとき、変更前の内容ではなく読み込み表示から始める */}
      <ResetOnNavigation>
        <Suspense fallback={<LoadingCard />}>
          <CategoryManagerLoader />
        </Suspense>
      </ResetOnNavigation>
    </main>
  );
}
