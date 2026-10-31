"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Category } from "@/lib/types";

export type CategoryFormState = {
  error?: string;
  name?: string;
};

type Props = {
  categories: Category[];
  createCategoryAction: (
    prevState: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
};

export function CategoryManager({ categories, createCategoryAction }: Props) {
  const [state, formAction, isPending] = useActionState(createCategoryAction, {});

  return (
    <div className="flex flex-col gap-6">
      {/* エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す */}
      <form key={JSON.stringify(state)} action={formAction} className="flex flex-col gap-1">
        <label htmlFor="name">カテゴリー名</label>
        <div className="flex gap-2">
          <input
            id="name"
            name="name"
            type="text"
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5"
            defaultValue={state.name ?? ""}
            aria-invalid={state.error ? true : undefined}
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
            disabled={isPending}
          >
            登録
          </button>
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </form>

      {categories.length === 0 ? (
        <p className="text-zinc-600">カテゴリーがまだ登録されていません</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {categories.map((category) => (
            <li key={category.id} className="py-2">
              {category.name}
            </li>
          ))}
        </ul>
      )}

      <div>
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/">
          戻る
        </Link>
      </div>
    </div>
  );
}
