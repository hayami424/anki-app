"use client";

import Link from "next/link";
import { useActionState } from "react";
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

const inputClassName = "rounded border border-zinc-300 px-2 py-1.5";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-600">
      {message}
    </p>
  );
}

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
    <form key={JSON.stringify(state)} action={formAction} className="flex flex-col gap-4">
      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId">カテゴリー</label>
        <select
          id="categoryId"
          name="categoryId"
          className={inputClassName}
          defaultValue={values.categoryId}
          aria-invalid={errors.categoryId ? true : undefined}
          aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
        >
          <option value="">選択してください</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError id="categoryId-error" message={errors.categoryId} />
        {!hasCategories && (
          <p className="text-sm text-zinc-600">
            カテゴリーがありません。{" "}
            <Link className="text-blue-600 underline" href="/categories">
              カテゴリーを登録する
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="question">問題</label>
        <textarea
          id="question"
          name="question"
          rows={3}
          className={inputClassName}
          defaultValue={values.question}
          aria-invalid={errors.question ? true : undefined}
          aria-describedby={errors.question ? "question-error" : undefined}
        />
        <FieldError id="question-error" message={errors.question} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="answer">解答</label>
        <textarea
          id="answer"
          name="answer"
          rows={2}
          className={inputClassName}
          defaultValue={values.answer}
          aria-invalid={errors.answer ? true : undefined}
          aria-describedby={errors.answer ? "answer-error" : undefined}
        />
        <FieldError id="answer-error" message={errors.answer} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="url">参考URL（任意）</label>
        <input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          className={inputClassName}
          defaultValue={values.url}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "url-error" : undefined}
        />
        <FieldError id="url-error" message={errors.url} />
      </div>

      <div className="flex gap-3">
        <Link className="rounded border border-zinc-300 px-4 py-2" href={cancelHref}>
          戻る
        </Link>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
          disabled={!hasCategories || isPending}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
