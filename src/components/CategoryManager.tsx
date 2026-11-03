"use client";

import { ArrowLeft, Check, CircleAlert, Folder, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CategorySummary } from "@/lib/types";

export type CategoryFormState = {
  error?: string;
  name?: string;
};

type CategoryFormAction = (
  prevState: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>;

type Props = {
  categories: CategorySummary[];
  createCategoryAction: CategoryFormAction;
  updateCategoryAction: (
    id: string,
    prevState: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  deleteCategoriesAction: (ids: string[]) => Promise<{ error?: string }>;
};

type EditFormProps = {
  category: CategorySummary;
  updateCategoryAction: Props["updateCategoryAction"];
  onClose: () => void;
};

function CategoryEditForm({ category, updateCategoryAction, onClose }: EditFormProps) {
  const [state, formAction, isPending] = useActionState<CategoryFormState, FormData>(
    async (prevState, formData) => {
      const result = await updateCategoryAction(category.id, prevState, formData);
      if (!result.error) onClose();
      return result;
    },
    {},
  );
  const inputId = `category-name-${category.id}`;

  return (
    // エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す
    <form key={JSON.stringify(state)} action={formAction} className="flex-1">
      <Field data-invalid={state.error ? true : undefined} className="gap-1.5">
        <FieldLabel htmlFor={inputId} className="sr-only">
          「{category.name}」の新しい名前
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          <Input
            id={inputId}
            name="name"
            type="text"
            className="min-w-40 flex-1"
            defaultValue={state.name ?? category.name}
            aria-invalid={state.error ? true : undefined}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={isPending}>
            <Check />
            保存
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X />
            キャンセル
          </Button>
        </div>
        <FieldError>{state.error}</FieldError>
      </Field>
    </form>
  );
}

export function CategoryManager({
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoriesAction,
}: Props) {
  const [state, formAction, isPending] = useActionState(createCategoryAction, {});
  const [editingId, setEditingId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, startDeleting] = useTransition();

  // 問題が残っているカテゴリーは選べないが、選んだ後に問題が増えた場合に備えて改めて絞り込む
  const idsToDelete = categories
    .filter((category) => category.questionCount === 0 && selectedIds.has(category.id))
    .map((category) => category.id);

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
    if (!window.confirm(`選択した ${idsToDelete.length} 件のカテゴリーを削除しますか？`)) {
      return;
    }
    startDeleting(async () => {
      const result = await deleteCategoriesAction(idsToDelete);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteError(undefined);
      setSelectedIds(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          {/* エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す */}
          <form key={JSON.stringify(state)} action={formAction}>
            <Field data-invalid={state.error ? true : undefined}>
              <FieldLabel htmlFor="name">カテゴリー名</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="例：英単語"
                  className="flex-1"
                  defaultValue={state.name ?? ""}
                  aria-invalid={state.error ? true : undefined}
                />
                <Button type="submit" disabled={isPending}>
                  <Plus />
                  登録
                </Button>
              </div>
              <FieldError>{state.error}</FieldError>
            </Field>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>登録済みのカテゴリー</CardTitle>
          <CardDescription>{categories.length} 件</CardDescription>
          {categories.length > 0 && (
            <CardAction>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={idsToDelete.length === 0 || isDeleting}
                onClick={handleDelete}
              >
                <Trash2 />
                選択したカテゴリーを削除
              </Button>
            </CardAction>
          )}
        </CardHeader>

        {deleteError && (
          <div className="border-b p-4">
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            カテゴリーがまだ登録されていません
          </p>
        ) : (
          <ul className="divide-y">
            {categories.map((category) => {
              const hasQuestions = category.questionCount > 0;
              return (
                <li key={category.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Checkbox
                    aria-label={`「${category.name}」を選択`}
                    checked={selectedIds.has(category.id)}
                    disabled={hasQuestions}
                    title={hasQuestions ? "問題が登録されているため削除できません" : undefined}
                    onCheckedChange={() => toggleSelected(category.id)}
                  />
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Folder className="size-4" />
                  </span>
                  {editingId === category.id ? (
                    <CategoryEditForm
                      category={category}
                      updateCategoryAction={updateCategoryAction}
                      onClose={() => setEditingId(undefined)}
                    />
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{category.name}</span>
                      <Badge variant="secondary" className="tabular-nums">
                        {category.questionCount} 問
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`「${category.name}」を修正`}
                        onClick={() => setEditingId(category.id)}
                      >
                        <Pencil />
                        修正
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div>
        {/* 画面遷移図 ⑳ のボタン名に合わせる */}
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          <ArrowLeft />
          問題一覧
        </Link>
      </div>
    </div>
  );
}
