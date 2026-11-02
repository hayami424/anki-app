// メールのリンクなどで受け取る戻り先は、外部サイトへ飛ばされないようアプリ内のパスだけを許可する
export function safeNextPath(next: string | null): string {
  if (next === null || !next.startsWith("/")) return "/";
  // "//evil.example" や "/\evil.example" はブラウザが別のホストとして解釈する
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
