"use client";

import { useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";

// Cache Components では一度開いた画面が <Activity> で状態ごと残り、同じ URL に移動すると前回の状態で表示される。
// リンクや redirect で移動してきたときは中身を作り直し、ブラウザの戻る・進むでは状態を残す（bfcacheId の仕様）。
// 例: 問題修正から復習画面に戻ったとき、前回の判定結果ではなく修正した問題から再開する
export function ResetOnNavigation({ children }: { children: ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
