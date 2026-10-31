import { Suspense } from "react";
import { CategoryManager } from "@/components/CategoryManager";
import { getCategories } from "@/lib/data/questions";
import { createCategory } from "./actions";

async function CategoryManagerLoader() {
  const categories = await getCategories();
  return <CategoryManager categories={categories} createCategoryAction={createCategory} />;
}

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">カテゴリー一覧</h1>
      <Suspense fallback={<p className="text-zinc-600">読み込み中...</p>}>
        <CategoryManagerLoader />
      </Suspense>
    </main>
  );
}
