"use client";

import { ArrowLeft, CircleAlert, MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AuthFormState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  signUpAction: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function SignUpForm({ signUpAction }: Props) {
  const [state, formAction, isPending] = useActionState(signUpAction, {});
  const errors = state.errors ?? {};

  if (state.sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">確認メールを送信しました</p>
            <p className="text-sm text-muted-foreground">
              メール内のリンクを開くと登録が完了します
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

            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="name">名前</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                defaultValue={state.values?.name ?? ""}
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
                defaultValue={state.values?.email ?? ""}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              <FieldError id="email-error">{errors.email}</FieldError>
            </Field>

            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor="password">パスワード</FieldLabel>
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
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/login">
            <ArrowLeft />
            戻る
          </Link>
          <Button type="submit" disabled={isPending}>
            <UserPlus />
            登録
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
