"use client";

import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/types";
import type { QuestionFieldErrors, QuestionFormValues } from "@/lib/validation";

export type QuestionFormState = {
  errors?: QuestionFieldErrors & { form?: string };
  values?: QuestionFormValues;
};

type Props = {
  categories: Category[];
  action: (prevState: QuestionFormState, formData: FormData) => Promise<QuestionFormState>;
  initialValues?: QuestionFormValues;
  submitLabel: string;
  cancelHref: string;
};

const emptyValues: QuestionFormValues = { categoryId: "", question: "", answer: "", url: "" };

export function QuestionForm({
  categories,
  action,
  initialValues = emptyValues,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, {});
  const values = state.values ?? initialValues;
  const errors = state.errors ?? {};
  const hasCategories = categories.length > 0;

  return (
    // エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す
    <form key={JSON.stringify(state)} action={formAction}>
      <Card>
        <CardContent>
          <FieldGroup>
            {errors.form && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={errors.categoryId ? true : undefined}>
              <FieldLabel htmlFor="categoryId">カテゴリー</FieldLabel>
              <NativeSelect
                id="categoryId"
                name="categoryId"
                className="w-full sm:w-72"
                defaultValue={values.categoryId}
                aria-invalid={errors.categoryId ? true : undefined}
                aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
              >
                <NativeSelectOption value="">選択してください</NativeSelectOption>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError id="categoryId-error">{errors.categoryId}</FieldError>
              {!hasCategories && (
                <FieldDescription>
                  カテゴリーがありません。{" "}
                  <Link href="/categories">カテゴリーを登録する</Link>
                </FieldDescription>
              )}
            </Field>

            <Field data-invalid={errors.question ? true : undefined}>
              <FieldLabel htmlFor="question">問題</FieldLabel>
              <Textarea
                id="question"
                name="question"
                rows={3}
                placeholder="例：江戸幕府を開いたのは？"
                defaultValue={values.question}
                aria-invalid={errors.question ? true : undefined}
                aria-describedby={errors.question ? "question-error" : undefined}
              />
              <FieldError id="question-error">{errors.question}</FieldError>
            </Field>

            <Field data-invalid={errors.answer ? true : undefined}>
              <FieldLabel htmlFor="answer">解答</FieldLabel>
              <Textarea
                id="answer"
                name="answer"
                rows={2}
                placeholder="例：徳川家康"
                defaultValue={values.answer}
                aria-invalid={errors.answer ? true : undefined}
                aria-describedby={errors.answer ? "answer-error" : undefined}
              />
              <FieldDescription>
                復習では、この解答と完全に一致したときに正解になります
              </FieldDescription>
              <FieldError id="answer-error">{errors.answer}</FieldError>
            </Field>

            <Field data-invalid={errors.url ? true : undefined}>
              <FieldLabel htmlFor="url">参考URL（任意）</FieldLabel>
              <Input
                id="url"
                name="url"
                type="text"
                inputMode="url"
                placeholder="https://"
                defaultValue={values.url}
                aria-invalid={errors.url ? true : undefined}
                aria-describedby={errors.url ? "url-error" : undefined}
              />
              <FieldError id="url-error">{errors.url}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={cancelHref}>
            <ArrowLeft />
            戻る
          </Link>
          <Button type="submit" disabled={!hasCategories || isPending}>
            {submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
