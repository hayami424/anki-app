"use client";

import { ArrowLeft, CircleAlert, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AuthFormState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  requestPasswordResetAction: (
    prevState: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
};

export function ForgotPasswordForm({ requestPasswordResetAction }: Props) {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, {});
  const errors = state.errors ?? {};

  if (state.sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">再設定メールを送信しました</p>
            <p className="text-sm text-muted-foreground">
              メール内のリンクから新しいパスワードを設定してください
            </p>
          </div>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/login">
            <ArrowLeft />
            ログイン画面へ
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    // エラー後に入力値を復元するため、送信結果ごとにフォームを作り直す。
    // ブラウザの検証メッセージではなくアプリの文言で案内するため noValidate にする
    <form key={JSON.stringify(state)} action={formAction} noValidate>
      <Card>
        <CardContent>
          <FieldGroup>
            {errors.form && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.values?.email ?? ""}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              <FieldError id="email-error">{errors.email}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-between gap-2">
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/login">
            <ArrowLeft />
            戻る
          </Link>
          <Button type="submit" disabled={isPending}>
            <Send />
            送信
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
