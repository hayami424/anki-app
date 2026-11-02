import { PageHeader } from "@/components/PageHeader";
import { SignUpForm } from "@/components/SignUpForm";
import { signUp } from "../auth/actions";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="新規登録" description="名前・メールアドレス・パスワードを登録します" />
      <SignUpForm signUpAction={signUp} />
    </main>
  );
}
