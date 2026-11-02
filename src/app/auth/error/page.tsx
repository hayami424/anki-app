import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-10">
      <PageHeader title="リンクを確認できませんでした" />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleAlert className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">リンクの有効期限が切れているか、すでに使われています</p>
            <p className="text-sm text-muted-foreground">
              お手数ですが、もう一度メールの送信からやり直してください
            </p>
          </div>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/login">
            <ArrowLeft />
            ログイン画面へ
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
