import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="size-5" />
          </span>
          {/* スマートフォン幅ではプロフィール・ログアウトと並ぶと収まらないため、文字は読み上げ用にだけ残す */}
          <span className="sr-only sm:not-sr-only">超効率！暗記アプリ</span>
        </Link>
        {/* ログイン状態は cookie から読むリクエストごとの情報なので Suspense で包む */}
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
