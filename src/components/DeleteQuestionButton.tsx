"use client";

import { useState, useTransition } from "react";

type Props = {
  id: string;
  deleteQuestionAction: (id: string) => Promise<{ error?: string }>;
};

export function DeleteQuestionButton({ id, deleteQuestionAction }: Props) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("この問題を削除しますか？")) return;
    startTransition(async () => {
      // 成功時はアクション側で問題一覧へリダイレクトする
      const result = await deleteQuestionAction(id);
      setError(result?.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40"
        disabled={isPending}
        onClick={handleClick}
      >
        削除
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
