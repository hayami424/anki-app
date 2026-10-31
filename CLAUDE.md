# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

Anki 風の暗記カードアプリ「超効率！暗記アプリ」（`anki-app`）。仕様は `docs/暗記アプリ要件定義書_20240125.docx`（機能一覧・画面遷移図は docx 内の画像）。

- 要件定義書の機能一覧は「作成フェーズ」1 / 2 に分かれている。**現在はフェーズ1（問題の登録・修正・削除、カテゴリー登録、一覧・詳細表示、今日の問題の出題・正誤判定）まで実装済み**。
- フェーズ2で残っているもの: 認証（新規登録・ログイン・ログアウト・個人設定・アカウント削除）、カテゴリーの修正・削除、出題タイプ選択（今日の問題 / 全問復習 / カテゴリー別）。

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
- **shadcn/ui** を導入済み（設定は `components.json`）。スタイルは `base-nova`（Radix ではなく **Base UI**（`@base-ui/react`）ベース）、基本色 neutral、アイコンは `lucide-react`。
  - 部品の追加は `npx shadcn@latest add <name>`。生成先は `src/components/ui/`（CLI が管理するファイルなので、画面固有の UI は `src/components/` 直下に置く）。
  - クラス名の結合は `@/lib/utils` の `cn()`（中身は shadcn 公式の `cn` パッケージ。clsx / tailwind-merge は入れていない）。
  - テーマは `globals.css` の CSS 変数（`--primary` など）で定義し、`@theme inline` で Tailwind の色に割り当てている。色は `bg-primary` / `text-muted-foreground` などのトークンを使う。
  - ダークモードは `.dark` クラス方式（`@custom-variant dark`）。現在 `dark` クラスを付ける仕組みはないため常にライト表示。
  - `shadcn init` は `--font-sans: var(--font-sans)` という自己参照を書き込むことがある。`--font-sans` は `var(--font-geist-sans), var(--font-noto-sans-jp), sans-serif` にすること（日本語は `layout.tsx` で読み込む Noto Sans JP で補う）。
  - アクセント色（`--primary`）はインディゴ。正解表示などに使う成功色として独自トークン `--success` / `--success-foreground`（`bg-success` など）を追加している。
  - `Link` をボタンの見た目にするときは `className={cn(buttonVariants({ ... }))}` と **必ず `cn()` で包む**（cva は結合するだけなので、`border-transparent` と `border-border` のような競合が解決されず outline の枠線が消える）。Base UI の `Button` に `render={<Link />}` を渡すと `role="button"` になりリンクとして扱われないため使わない。
  - 画面共通の部品: `AppHeader`（layout のヘッダー）、`PageHeader`（見出し・説明・操作ボタン）、`LoadingCard`（Suspense の fallback）、`PhaseBadge`（復習フェーズの表示）。
  - `<select>` は shadcn の `native-select` を使う（テストで `user.selectOptions` を使うため、Base UI の `Select` にはしない）。
  - `globals.css` を変更しても起動中の `next dev` に反映されないことがある。その場合は dev サーバーを再起動する。
- `LayoutProps<"/">` などのルート型は Next.js が自動生成するグローバル型（`next dev` / `next build` 時に生成）。
- パスエイリアス `@/*` → `./src/*`。

## Supabase

- プロジェクト: `anki-app`（ref: `nqdqtpwmhwyevcrshywf`、URL: `https://nqdqtpwmhwyevcrshywf.supabase.co`）。同じ組織に別アプリ用の `task-kanban` プロジェクトもあるため、Supabase MCP を使うときは project_id を取り違えないこと。
- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（キーの一覧は `.env.example`、実際の値は `.env.local`）。キーは旧来の anon キーではなく publishable キー（`sb_publishable_...`）を使う。
- パッケージは `@supabase/supabase-js` と `@supabase/ssr`。クライアントは用途で使い分ける:
  - `@/lib/supabase/server` の `createClient()` — Server Component / Server Action / Route Handler 用。`cookies()` を使うため **async**（`await createClient()`）。Server Component から呼ばれた場合、cookie の書き込みは握りつぶしている。
  - `@/lib/supabase/client` の `createClient()` — Client Component（`"use client"`）用。
- 起動時の接続チェック: `src/instrumentation.ts` の `register()` が Node.js ランタイムでのみ `checkSupabaseConnection()`（`src/lib/supabase/checkConnection.ts`）を実行する。`/auth/v1/health` に publishable キーを付けて問い合わせるので、テーブルがなくても確認できる。**失敗時のみ** `console.error` でログを出し、成功時は何も出さない方針。
- セッション更新用の `proxy.ts`（旧 middleware）はまだ用意していない。認証機能を追加するときに Supabase 公式の Next.js ガイドに沿って追加すること。

### データベース

- スキーマ変更は Supabase MCP の `apply_migration` で行い、同じ SQL を `supabase/migrations/<version>_<name>.sql` に保存する（version は `list_migrations` で確認）。変更後は `get_advisors`（security）を確認し、`generate_typescript_types` で `src/lib/supabase/database.types.ts` を再生成する。
- テーブル:
  - `categories` — `name` は一意・1〜50 文字。
  - `questions` — `category_id`（`categories` への FK、`on delete restrict`）、`question` / `answer`（1〜1000 文字）、`url`（null か `http(s)://`）、`review_phase`（1〜4）、`next_review_on`（date）、`created_at`、`updated_at`（トリガーで自動更新）。
  - 制約 `questions_next_review_on_consistency`: **`review_phase = 4` のときだけ `next_review_on` が null**。更新時は両方をセットで変えること。
- 入力値の制約はアプリ側（`src/lib/validation.ts`）と DB の check 制約の両方にある。上限を変えるときは両方を直す。
- **RLS は anon ロールに全許可（`using (true)`）している**。フェーズ1は認証なしのため。フェーズ2で認証を入れるときは `user_id` 列を追加し、`auth.uid()` で絞るポリシーに置き換えること（Server Action 側でも利用者確認を追加する）。カテゴリーの削除を実装するときは FK の `on delete restrict` の扱いも決める。
- エラーコードの扱い: `23505`（一意制約違反）→ カテゴリー名の重複メッセージ、`22P02`（不正な UUID）→ 存在しない問題として `notFound()`。

## アーキテクチャ

```
src/app/                 ページ（App Router）と Server Actions（各ディレクトリの actions.ts）
  page.tsx               問題一覧 /
  questions/new|[id]|[id]/edit   問題作成・詳細・修正（修正画面は ?from=detail で戻り先を切り替え）
  categories/            カテゴリー一覧・登録
  review/                復習（今日の問題）
src/components/          画面の UI（Client Component 中心）。データとアクションは props で受け取る
src/components/ui/       shadcn/ui の部品（CLI で生成）
src/lib/utils.ts         cn()（shadcn/ui 用のクラス名結合）
src/lib/data/questions.ts   Supabase からの取得（DB の行 → アプリの型への変換もここ）
src/lib/review/          出題日計算（schedule）・正誤判定（judge）・シャッフル（shuffle）。純粋関数
src/lib/validation.ts    フォーム入力の検証（FormData を受け取る純粋関数）
src/lib/types.ts         アプリ内で使う型（Question, Category, ReviewQuestion など）
```

- **ページの形**: `page.tsx` は同期コンポーネントにして見出しなどの静的部分を描画し、データ取得は `async` な `〜Loader` コンポーネントに分けて `<Suspense>` で包む（Cache Components では未キャッシュのデータ取得を Suspense の外で行うとエラーになる）。`params` / `searchParams` も Promise なので Loader 内で `await` する。
- `new Date()` や `Math.random()` をサーバーで使う前には `await connection()`（`next/server`）を呼ぶ（例: `src/app/review/page.tsx`）。
- **Server Actions** はページから Client Component に props で渡す（テストで差し替えるため）。フォームは `useActionState` を使い、エラー時は `{ errors, values }` を返して入力値を復元する（フォームの `key` に state を渡して作り直している）。成功時は `redirect()`、同じ画面のまま再表示したいときは `refresh()`（`next/cache`）。データはキャッシュしていないので `revalidatePath` などは不要。
- 引数を `.bind` で Server Action に渡すとクライアントから改ざんできるため、URL などをそのまま受け取らない（例: `updateQuestion` は戻り先を boolean で受け取り、パスはサーバーで組み立てる）。
- 削除の確認は `window.confirm` を使う。

### 出題日の計算（`src/lib/review/schedule.ts`）

- 日付はすべて**日本時間の `YYYY-MM-DD` 文字列**で扱う（`toTokyoDate()`）。DB の `next_review_on` も日本時間の日付。
- 作成時はフェーズ1・出題日は作成日の翌日（DB のデフォルト値）。
- 正解: フェーズ1→2（作成日 + 7 日）、2→3（作成日 + 30 日）、3→4（復習完了、出題日 null）。ただし計算した日がもう過ぎていたら翌日にする。
- 不正解: フェーズはそのまま、回答日からフェーズ1 = 1 日、2 = 7 日、3 = 30 日後。
- 「今日の問題」は `next_review_on <= 今日` の問題。解答時のスケジュール更新は、出題日を迎えている問題に限る（二重送信対策）。
- 正誤判定（`judge.ts`）は NFKC 正規化・前後の空白除去・連続する空白をまとめたうえで完全一致。英字の大文字・小文字は区別する。
- 解答の判定はサーバー（`src/app/review/actions.ts` の `submitAnswer`）で行い、復習画面のクライアントには正解を渡さない（`ReviewQuestion` 型）。

## テスト

- Vitest + React Testing Library + jsdom。設定は `vitest.config.mts`、セットアップは `vitest.setup.ts`。
- パス解決は Vite 組み込みの `resolve.tsconfigPaths: true` を使用（`vite-tsconfig-paths` プラグインは不要なので入れない）。
- `globals` は無効。`describe` / `test` / `expect` などは `vitest` から明示的に import する。jest-dom マッチャー（`toHaveTextContent` など）と各テスト後の `cleanup()` はセットアップファイルで登録済み。
- テストファイルは対象と同じディレクトリに `*.test.tsx` として置く（例: `src/app/page.test.tsx`）。純粋な関数のテストは `*.test.ts` でよい（例: `src/lib/review/schedule.test.ts`）。
- `async` な Server Component は Vitest でテストできない（同期コンポーネントのみ対象）。そのため画面の振る舞いは `src/components/` のコンポーネントに props（データとアクションの偽物）を渡してテストする。
- 操作は `@testing-library/user-event`（`userEvent.setup()`）で行う。Server Action の代わりは `vi.fn<(…) => Promise<…>>(async () => …)` のように型引数付きで作る（引数を書くと未使用変数の lint 警告になる）。
- `window.confirm` は `vi.spyOn(window, "confirm").mockReturnValue(true)` で差し替え、`afterEach` で `vi.restoreAllMocks()` する。
- ページ（`page.tsx`）のテストでは Supabase へのアクセス（`@/lib/data/questions`）を `vi.mock` で解決しない Promise にして、Suspense の外側（見出し・リンク）だけを検証する。Supabase への通信は外部依存なのでモックしてよい（`fetch` なら `vi.stubGlobal`）。
- 画面遷移は `next/link` の `href` を検証する（例: 「戻る」→ `/`、「問題修正」→ `/questions/[id]/edit?from=detail`）。

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

