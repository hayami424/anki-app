import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { PageHeader } from "@/components/PageHeader";
import { requestPasswordReset } from "../auth/actions";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader
        title="パスワードの再設定"
        description="登録済みのメールアドレスに再設定用のリンクを送ります"
      />
      <ForgotPasswordForm requestPasswordResetAction={requestPasswordReset} />
    </main>
  );
}
