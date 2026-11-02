"use client";

import { CircleAlert, LogIn, UserPlus } from "lucide-react";
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
  loginAction: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function LoginForm({ loginAction }: Props) {
  const [state, formAction, isPending] = useActionState(loginAction, {});
  const errors = state.errors ?? {};

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

            <Field data-invalid={errors.password ? true : undefined}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="password">パスワード</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  パスワードを忘れた方
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <FieldError id="password-error">{errors.password}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex-wrap justify-between gap-2">
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/signup">
            <UserPlus />
            新規登録
          </Link>
          <Button type="submit" disabled={isPending}>
            <LogIn />
            ログイン
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
