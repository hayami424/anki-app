"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

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
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="button" variant="destructive" disabled={isPending} onClick={handleClick}>
        <Trash2 />
        削除
      </Button>
    </>
  );
}
