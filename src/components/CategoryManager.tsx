"use client";

import { ArrowLeft, Folder, Plus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
        </CardHeader>
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            カテゴリーがまだ登録されていません
          </p>
        ) : (
          <ul className="divide-y">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Folder className="size-4" />
                </span>
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          <ArrowLeft />
          戻る
        </Link>
      </div>
    </div>
  );
}
