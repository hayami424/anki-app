"use client";

import { ArrowLeft, CircleAlert, CircleCheck, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AuthFieldErrors, AuthFormValues } from "@/lib/validation";

export type SettingsFormState = {
  errors?: AuthFieldErrors & { form?: string };
  values?: AuthFormValues;
  // 保存できたときの案内
  notice?: string;
};

type Props = {
  initialValues: AuthFormValues;
  updateProfileAction: (
    prevState: SettingsFormState,
    formData: FormData,
  ) => Promise<SettingsFormState>;
  deleteAccountAction: () => Promise<{ error?: string }>;
};

export function SettingsForm({ initialValues, updateProfileAction, deleteAccountAction }: Props) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {});
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, startDeleting] = useTransition();
  const values = state.values ?? initialValues;
  const errors = state.errors ?? {};

  function handleDelete() {
    if (
      !window.confirm(
        "アカウントを削除しますか？登録した問題とカテゴリーもすべて削除され、元に戻せません。",
      )
    ) {
      return;
    }
    startDeleting(async () => {
      const result = await deleteAccountAction();
      if (result.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す。
          Cache Components では一度開いた画面が <Activity> で入力欄ごと残るため、
          サーバーから届く初期値が変わったとき（保存して戻ってきたときなど）も作り直して新しい値を表示する。
          ブラウザの検証メッセージではなくアプリの文言で案内するため noValidate にする */}
      <form key={JSON.stringify([state, initialValues])} action={formAction} noValidate>
        <Card>
          <CardContent>
            <FieldGroup>
              {errors.form && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}
              {state.notice && (
                <Alert>
                  <CircleCheck className="text-success" />
                  <AlertDescription>{state.notice}</AlertDescription>
                </Alert>
              )}

              <Field data-invalid={errors.name ? true : undefined}>
                <FieldLabel htmlFor="name">名前</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  defaultValue={values.name}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                <FieldError id="name-error">{errors.name}</FieldError>
              </Field>

              <Field data-invalid={errors.email ? true : undefined}>
                <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={values.email}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <FieldDescription>
                  変更すると確認メールが届きます。リンクを開くまでは今のメールアドレスのままです
                </FieldDescription>
                <FieldError id="email-error">{errors.email}</FieldError>
              </Field>

              <Field data-invalid={errors.password ? true : undefined}>
                <FieldLabel htmlFor="password">新しいパスワード（変更する場合のみ）</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <FieldDescription>
                  英小文字・英大文字・数字・記号をすべて含む8文字以上
                </FieldDescription>
                <FieldError id="password-error">{errors.password}</FieldError>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="justify-between gap-2">
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
              <ArrowLeft />
              戻る
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save />
              保存
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>アカウント削除</CardTitle>
          <CardDescription>
            アカウントと、登録した問題・カテゴリーをすべて削除します。元に戻すことはできません
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          {deleteError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 />
            アカウントを削除
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
