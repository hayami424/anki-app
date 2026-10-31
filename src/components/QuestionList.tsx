"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Category, Question } from "@/lib/types";

type SortKey = "createdDesc" | "createdAsc" | "nextReviewAsc" | "nextReviewDesc";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "createdDesc", label: "作成日（新しい順）" },
  { value: "createdAsc", label: "作成日（古い順）" },
  { value: "nextReviewAsc", label: "出題日（近い順）" },
  { value: "nextReviewDesc", label: "出題日（遠い順）" },
];

const phaseOptions = [1, 2, 3, 4] as const;

function compareQuestions(a: Question, b: Question, sortKey: SortKey): number {
  switch (sortKey) {
    case "createdDesc":
      return b.createdAt.localeCompare(a.createdAt);
    case "createdAsc":
      return a.createdAt.localeCompare(b.createdAt);
    case "nextReviewAsc":
    case "nextReviewDesc": {
      // 出題日のない（復習完了の）問題はどちらの順でも最後に並べる
      if (a.nextReviewOn === null) return b.nextReviewOn === null ? 0 : 1;
      if (b.nextReviewOn === null) return -1;
      const order = a.nextReviewOn.localeCompare(b.nextReviewOn);
      return sortKey === "nextReviewAsc" ? order : -order;
    }
  }
}

type Props = {
  questions: Question[];
  categories: Category[];
  deleteQuestionsAction: (ids: string[]) => Promise<{ error?: string }>;
};

export function QuestionList({ questions, categories, deleteQuestionsAction }: Props) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdDesc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const visibleQuestions = questions
    .filter((q) => categoryFilter === "all" || q.categoryId === categoryFilter)
    .filter((q) => phaseFilter === "all" || String(q.reviewPhase) === phaseFilter)
    .toSorted((a, b) => compareQuestions(a, b, sortKey));

  // 絞り込みで見えなくなった問題は誤って削除しないよう対象外にする
  const idsToDelete = visibleQuestions
    .filter((q) => selectedIds.has(q.id))
    .map((q) => q.id);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDelete() {
    if (!window.confirm(`選択した ${idsToDelete.length} 件の問題を削除しますか？`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteQuestionsAction(idsToDelete);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setSelectedIds(new Set());
    });
  }

  if (questions.length === 0) {
    return <p className="text-zinc-600">問題がまだ登録されていません</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          カテゴリーで絞り込み
          <select
            className="rounded border border-zinc-300 px-2 py-1"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">すべて</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          復習フェーズで絞り込み
          <select
            className="rounded border border-zinc-300 px-2 py-1"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <option value="all">すべて</option>
            {phaseOptions.map((phase) => (
              <option key={phase} value={String(phase)}>
                フェーズ{phase}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          並び替え
          <select
            className="rounded border border-zinc-300 px-2 py-1"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ml-auto rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          disabled={idsToDelete.length === 0 || isPending}
          onClick={handleDelete}
        >
          選択した問題を削除
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {visibleQuestions.length === 0 ? (
        <p className="text-zinc-600">条件に一致する問題がありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-300">
              <tr>
                <th className="p-2">選択</th>
                <th className="p-2">作成日</th>
                <th className="p-2">問題</th>
                <th className="p-2">カテゴリー</th>
                <th className="p-2">出題日</th>
                <th className="p-2">復習フェーズ</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleQuestions.map((q) => (
                <tr key={q.id} className="border-b border-zinc-200">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={`「${q.question}」を選択`}
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelected(q.id)}
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap">{q.createdOn}</td>
                  <td className="p-2">{q.question}</td>
                  <td className="p-2 whitespace-nowrap">{q.categoryName}</td>
                  <td className="p-2 whitespace-nowrap">{q.nextReviewOn ?? "なし"}</td>
                  <td className="p-2 whitespace-nowrap">フェーズ{q.reviewPhase}</td>
                  <td className="p-2 whitespace-nowrap">
                    <Link className="mr-3 text-blue-600 underline" href={`/questions/${q.id}`}>
                      詳細
                    </Link>
                    <Link className="text-blue-600 underline" href={`/questions/${q.id}/edit`}>
                      修正
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
