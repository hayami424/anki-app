# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

Anki 風の暗記カードアプリ（`anki-app`）。現状は `create-next-app` の雛形にテスト環境を足しただけの段階で、アプリ固有のコードはまだない。

## コマンド

```bash
npm run dev          # 開発サーバー (http://localhost:3000)
npm run build        # 本番ビルド
npm run lint         # ESLint (flat config: eslint.config.mjs)
npx tsc --noEmit     # 型チェック（専用スクリプトなし）

npm test             # Vitest をウォッチモードで起動
npm run test:run     # Vitest を 1 回だけ実行
npx vitest run src/app/page.test.tsx   # 単一ファイルのみ実行
npx vitest run -t "見出し"              # テスト名で絞り込み
```

## 技術スタックと注意点

- **Next.js 16 / React 19 / App Router**。学習データ上の Next.js とは API や規約が異なる可能性があるため、コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを確認すること（AGENTS.md 参照）。
- **Cache Components が有効**（`next.config.ts` の `cacheComponents: true` + `partialPrefetching: true`）。データ取得はデフォルトで動的になり、キャッシュしたい箇所に `use cache` / `cacheLife` / `cacheTag` を使う方式。route segment config の `runtime` export は使えない。旧来の `revalidate` などの書き方を持ち込まないこと（`docs/01-app/02-guides/migrating-to-cache-components.md` 参照）。
- **Tailwind CSS v4 は PostCSS ではなく Turbopack ローダー経由**で読み込んでいる（`next.config.ts` の `turbopack.rules` で `*.css` に `@tailwindcss/turbopack` を適用）。`postcss.config` や `tailwind.config` は存在しない。テーマ変数は `src/app/globals.css` の `@theme inline` で定義。
- `LayoutProps<"/">` などのルート型は Next.js が自動生成するグローバル型（`next dev` / `next build` 時に生成）。
- パスエイリアス `@/*` → `./src/*`。

## テスト

- Vitest + React Testing Library + jsdom。設定は `vitest.config.mts`、セットアップは `vitest.setup.ts`。
- パス解決は Vite 組み込みの `resolve.tsconfigPaths: true` を使用（`vite-tsconfig-paths` プラグインは不要なので入れない）。
- `globals` は無効。`describe` / `test` / `expect` などは `vitest` から明示的に import する。jest-dom マッチャー（`toHaveTextContent` など）と各テスト後の `cleanup()` はセットアップファイルで登録済み。
- テストファイルは対象と同じディレクトリに `*.test.tsx` として置く（例: `src/app/page.test.tsx`）。
- `async` な Server Component は Vitest でテストできない（同期コンポーネントのみ対象）。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向・逆方向を検証してください
- モック方針: 外部依存のみモック化してください

## 禁止事項
- console.logを本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してください

