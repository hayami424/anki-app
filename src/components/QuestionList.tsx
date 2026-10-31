"use client";

import { CircleAlert, Eye, Inbox, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { PhaseBadge } from "@/components/PhaseBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">問題がまだ登録されていません</p>
            <p className="text-sm text-muted-foreground">
              「問題作成」から最初の問題を登録しましょう
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-end gap-3 border-b p-4">
        <Field className="w-auto gap-1.5">
          <FieldLabel htmlFor="categoryFilter" className="text-xs text-muted-foreground">
            カテゴリーで絞り込み
          </FieldLabel>
          <NativeSelect
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <NativeSelectOption value="all">すべて</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto gap-1.5">
          <FieldLabel htmlFor="phaseFilter" className="text-xs text-muted-foreground">
            復習フェーズで絞り込み
          </FieldLabel>
          <NativeSelect
            id="phaseFilter"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <NativeSelectOption value="all">すべて</NativeSelectOption>
            {phaseOptions.map((phase) => (
              <NativeSelectOption key={phase} value={String(phase)}>
                フェーズ{phase}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field className="w-auto gap-1.5">
          <FieldLabel htmlFor="sortKey" className="text-xs text-muted-foreground">
            並び替え
          </FieldLabel>
          <NativeSelect
            id="sortKey"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {sortOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Button
          type="button"
          variant="destructive"
          className="ml-auto"
          disabled={idsToDelete.length === 0 || isPending}
          onClick={handleDelete}
        >
          <Trash2 />
          選択した問題を削除
        </Button>
      </div>

      {error && (
        <div className="border-b p-4">
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {visibleQuestions.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          条件に一致する問題がありません
        </p>
      ) : (
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10 pl-4">
                <span className="sr-only">選択</span>
              </TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>問題</TableHead>
              <TableHead>カテゴリー</TableHead>
              <TableHead>出題日</TableHead>
              <TableHead>復習フェーズ</TableHead>
              <TableHead className="pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleQuestions.map((q) => (
              <TableRow key={q.id} data-state={selectedIds.has(q.id) ? "selected" : undefined}>
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`「${q.question}」を選択`}
                    checked={selectedIds.has(q.id)}
                    onCheckedChange={() => toggleSelected(q.id)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{q.createdOn}</TableCell>
                <TableCell className="max-w-xs truncate font-medium" title={q.question}>
                  {q.question}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{q.categoryName}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">
                  {q.nextReviewOn ?? <span className="text-muted-foreground">なし</span>}
                </TableCell>
                <TableCell>
                  <PhaseBadge phase={q.reviewPhase} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Link
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    href={`/questions/${q.id}`}
                  >
                    <Eye />
                    詳細
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    href={`/questions/${q.id}/edit`}
                  >
                    <Pencil />
                    修正
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        全 {questions.length} 件中 {visibleQuestions.length} 件を表示
      </p>
    </Card>
  );
}
