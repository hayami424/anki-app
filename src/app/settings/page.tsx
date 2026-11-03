import { Suspense } from "react";
import { LoadingCard } from "@/components/LoadingCard";
import { PageHeader } from "@/components/PageHeader";
import { ResetOnNavigation } from "@/components/ResetOnNavigation";
import { SettingsForm } from "@/components/SettingsForm";
import { requireUser } from "@/lib/auth";
import { deleteAccount, updateProfile } from "./actions";

async function SettingsFormLoader() {
  const { claims } = await requireUser();
  const displayName = claims.user_metadata?.display_name;
  return (
    <SettingsForm
      initialValues={{
        name: typeof displayName === "string" ? displayName : "",
        email: claims.email ?? "",
      }}
      updateProfileAction={updateProfile}
      deleteAccountAction={deleteAccount}
    />
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="個人設定" description="名前・メールアドレス・パスワードを変更します" />
      {/* 一度開いた個人設定にもう一度来たとき、保存前の名前ではなく読み込み表示から始める */}
      <ResetOnNavigation>
        <Suspense fallback={<LoadingCard />}>
          <SettingsFormLoader />
        </Suspense>
      </ResetOnNavigation>
    </main>
  );
}
