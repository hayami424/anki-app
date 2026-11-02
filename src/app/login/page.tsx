import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import { login } from "../auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="ログイン" description="メールアドレスとパスワードでログインします" />
      <LoginForm loginAction={login} />
    </main>
  );
}
