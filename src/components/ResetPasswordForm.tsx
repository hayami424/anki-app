"use client";

import { CircleAlert, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

type Props = {
  resetPasswordAction: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function ResetPasswordForm({ resetPasswordAction }: Props) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, {});
  const errors = state.errors ?? {};

  return (
    <form action={formAction}>
      <Card>
        <CardContent>
          <FieldGroup>
            {errors.form && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor="password">新しいパスワード</FieldLabel>
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

        <CardFooter className="justify-end">
          <Button type="submit" disabled={isPending}>
            <KeyRound />
            パスワードを変更
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
