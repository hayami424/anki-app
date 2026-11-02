import { PageHeader } from "@/components/PageHeader";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { resetPassword } from "../auth/actions";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="新しいパスワード" description="新しく使うパスワードを設定します" />
      <ResetPasswordForm resetPasswordAction={resetPassword} />
    </main>
  );
}
