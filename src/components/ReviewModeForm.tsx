"use client";

import { ListFilter } from "lucide-react";
import Form from "next/form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ReviewMode, ReviewSelection } from "@/lib/review/mode";
import type { Category } from "@/lib/types";

const modeOptions: { value: ReviewMode; label: string }[] = [
  { value: "today", label: "今日の問題" },
  { value: "all", label: "全問復習" },
  { value: "category", label: "カテゴリー別" },
];

type Props = {
  selection: ReviewSelection;
  categories: Category[];
};

// 出題タイプを選ぶフォーム。GET で /review?mode=...&categoryId=... に移動し、ページ側で出題する問題を取り直す
export function ReviewModeForm({ selection, categories }: Props) {
  const [mode, setMode] = useState<ReviewMode>(selection.mode);
  const categoryId = selection.mode === "category" ? (selection.categoryId ?? "") : "";

  return (
    <Form action="/review" className="flex w-full flex-wrap items-end justify-center gap-3">
      <Field className="w-auto gap-1.5">
        <FieldLabel htmlFor="mode" className="text-xs text-muted-foreground">
          出題タイプ
        </FieldLabel>
        <NativeSelect
          id="mode"
          name="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as ReviewMode)}
        >
          {modeOptions.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      {mode === "category" && (
        <Field className="w-auto gap-1.5">
          <FieldLabel htmlFor="categoryId" className="text-xs text-muted-foreground">
            カテゴリー
          </FieldLabel>
          <NativeSelect id="categoryId" name="categoryId" defaultValue={categoryId}>
            <NativeSelectOption value="">選択してください</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}
      <Button type="submit" variant="outline">
        <ListFilter />
        この条件で出題
      </Button>
    </Form>
  );
}
