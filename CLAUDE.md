# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

Anki 風の暗記カードアプリ「超効率！暗記アプリ」（`anki-app`）。仕様は `docs/暗記アプリ要件定義書_20240125.docx`（機能一覧・画面遷移図は docx 内の画像）。

- 要件定義書の機能一覧は「作成フェーズ」1 / 2 に分かれている。**フェーズ1（問題の登録・修正・削除、カテゴリー登録、一覧・詳細表示、今日の問題の出題・正誤判定）と、フェーズ2の認証（新規登録・ログイン（パスワード再設定メールを含む）・ログアウト・個人設定・アカウント削除）、カテゴリーの修正・削除、出題タイプ選択（今日の問題 / 全問復習 / カテゴリー別）まで実装済みで、要件定義書の機能はすべて揃っている**。

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
  - 画面共通の部品: `AppHeader`（layout のヘッダー。右側の `UserMenu` がログイン中の名前・「プロフィール」・「ログアウト」を出す。スマートフォン幅ではロゴの文字を `sr-only` にして横幅を空けている）、`PageHeader`（見出し・説明・操作ボタン）、`LoadingCard`（Suspense の fallback）、`PhaseBadge`（復習フェーズの表示）。
  - `<select>` は shadcn の `native-select` を使う（テストで `user.selectOptions` を使うため、Base UI の `Select` にはしない）。
  - `globals.css` を変更しても起動中の `next dev` に反映されないことがある。その場合は dev サーバーを再起動する。
- `LayoutProps<"/">` などのルート型は Next.js が自動生成するグローバル型（`next dev` / `next build` 時に生成）。
- パスエイリアス `@/*` → `./src/*`。

## Supabase

- プロジェクト: `anki-app`（ref: `nqdqtpwmhwyevcrshywf`、URL: `https://nqdqtpwmhwyevcrshywf.supabase.co`）。同じ組織に別アプリ用の `task-kanban` プロジェクトもあるため、Supabase MCP を使うときは project_id を取り違えないこと。
- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（キーの一覧は `.env.example`、実際の値は `.env.local`）。キーは旧来の anon キーではなく publishable キー（`sb_publishable_...`）を使う。
- パッケージは `@supabase/supabase-js` と `@supabase/ssr`。クライアントは用途で使い分ける:
  - `@/lib/supabase/server` の `createClient()` — Server Component / Server Action / Route Handler 用。`cookies()` を使うため **async**（`await createClient()`）。Server Component から呼ばれた場合、cookie の書き込みは握りつぶしている。中で `await connection()` を呼んでいる（Supabase がトークンの期限確認に `Date.now()` を使い、Partial Prefetching の App Shell（`cookies()` を読む部分も事前描画される）で「Blocking Route」エラーになるため）。
  - `@/lib/supabase/client` の `createClient()` — Client Component（`"use client"`）用。
- 起動時の接続チェック: `src/instrumentation.ts` の `register()` が Node.js ランタイムでのみ `checkSupabaseConnection()`（`src/lib/supabase/checkConnection.ts`）を実行する。`/auth/v1/health` に publishable キーを付けて問い合わせるので、テーブルがなくても確認できる。**失敗時のみ** `console.error` でログを出し、成功時は何も出さない方針。
### 認証

- メールアドレス + パスワード（Supabase Auth）。**メールアドレスの確認は必須**（Supabase の既定）。名前は `user_metadata.display_name` に保存する。
- `src/proxy.ts`（旧 middleware）→ `src/lib/supabase/proxy.ts` の `updateSession()` がアクセストークンを更新し、未ログインなら `/login` へ、ログイン済みで `/login`・`/signup`・`/forgot-password` に来たら `/` へリダイレクトする。ログインなしで開ける画面を増やすときは `publicPaths` に追加する。`createServerClient` と `getClaims()` の間に処理を挟まないこと。
- Server Action は先頭で `@/lib/auth` の `requireUser()` を呼ぶ（未ログインなら `/login` へ。`{ supabase, userId, claims }` を返す。`claims.email` や `claims.user_metadata.display_name` で現在のメールアドレス・名前が分かる）。データは RLS で本人のものに絞られる。
- メールのリンクの戻り先は `@/lib/auth` の `confirmUrl(next)` で組み立てる。`"use server"` のファイルで async 関数を export するとクライアントから呼べる Server Action になるため、補助関数は `actions.ts` に置かない。
- 個人設定（`/settings`、`src/app/settings/actions.ts`）: 名前は `updateUser({ data: { display_name } })`、メールアドレスは確認メール経由で変更（既定の Secure email change では新旧両方に届き、リンクを開くまで変わらない）、パスワードは空なら変更しない。変更前のメールアドレスはクライアントから受け取らずセッションから取る。名前は JWT の `user_metadata` から表示しているため、`updateUser` の後に `refreshSession()` でトークンを発行し直す（しないとヘッダーの名前が再ログインまで古いまま）。保存後は問題一覧へ移動する（画面遷移図 ⑤）。メールアドレスを変えたときだけ、確認メールの案内を出すため個人設定画面に残る。
- アカウント削除は RPC `public.delete_own_account()`（`security definer`、`auth.uid()` 本人の `auth.users` を削除し、FK の cascade で問題・カテゴリーも消える）。secret キーをアプリに持たせないためこの方式にしている。`get_advisors` の `authenticated_security_definer_function_executable` 警告はこの関数のもので想定どおり。削除後は `signOut({ scope: "local" })` で cookie だけ消して `/login` へ。
- 認証の Server Actions は `src/app/auth/actions.ts`（`login` / `signUp` / `requestPasswordReset` / `resetPassword` / `logout`）。Supabase のエラーは `error.code`（`invalid_credentials`、`email_not_confirmed` など）で文言を出し分ける。
- 確認メール・再設定メールのリンクは `src/app/auth/confirm/route.ts` で受ける。`token_hash` + `type`（`verifyOtp`）と `code`（`exchangeCodeForSession`。既定のメールテンプレートの場合で、同じブラウザでのみ有効）の両方に対応。戻り先 `next` は `safeNextPath()`（`src/lib/safeNextPath.ts`）でアプリ内のパスに限定する。失敗時は `/auth/error`。
- Supabase ダッシュボード側の設定（コード管理外）: Site URL は Vercel の公開 URL、Redirect URLs は `http://localhost:3000/**` と `https://<公開 URL>/**`。`?next=...` が付いても許可されるよう `/**` で登録する。許可されない戻り先を渡すと Site URL にフォールバックするため、Site URL を Supabase の URL にすると確認リンクが `{"error":"requested path is invalid"}` になる。
- パスワードの条件（英小文字・英大文字・数字・記号をすべて含む 8 文字以上）は `validatePassword()` とダッシュボードのパスワードポリシーの両方で設定している。ログイン時は形式を確認しない。

### データベース

- スキーマ変更は Supabase MCP の `apply_migration` で行い、同じ SQL を `supabase/migrations/<version>_<name>.sql` に保存する（version は `list_migrations` で確認）。変更後は `get_advisors`（security）を確認し、`generate_typescript_types` で `src/lib/supabase/database.types.ts` を再生成する。
- テーブル:
  - 両テーブルとも `user_id`（`auth.users` への FK、`on delete cascade`、既定値 `auth.uid()`、NOT NULL）を持つ。insert 時は `user_id` を渡さず既定値に任せる。
  - `categories` — `name` は利用者ごとに一意（`(user_id, name)`）・1〜50 文字。
  - `questions` — `category_id`（`categories` への FK）、`question` / `answer`（1〜1000 文字）、`url`（null か `http(s)://`）、`review_phase`（1〜4）、`next_review_on`（date）、`created_at`、`updated_at`（トリガーで自動更新）。
  - `questions` → `categories` の FK は 2 つある: `questions_category_id_fkey`（`category_id` 単独）と `questions_category_id_user_id_fkey`（`(category_id, user_id)` 複合。他人のカテゴリーを参照させないため）。どちらも `no action`（問題が残るカテゴリーは削除できない。アカウント削除時は同じ文の中で両方消えるので通る）。**PostgREST で埋め込むときは `categories!questions_category_id_fkey(name)` と FK を指定する**（指定しないと曖昧でエラーになる）。
  - 制約 `questions_next_review_on_consistency`: **`review_phase = 4` のときだけ `next_review_on` が null**。更新時は両方をセットで変えること。
- 入力値の制約はアプリ側（`src/lib/validation.ts`）と DB の check 制約の両方にある。上限を変えるときは両方を直す。
- **RLS は `authenticated` ロールのみ、`(select auth.uid()) = user_id` の行だけ select / insert / update / delete できる**。anon には何も許可していない。
- フェーズ1で作ったデータは、マイグレーション `assign_existing_rows_and_require_user_id` で最初に登録した利用者（作者本人）に割り当て済み。
- エラーコードの扱い: `23505`（一意制約違反）→ カテゴリー名の重複メッセージ、`22P02`（不正な UUID）→ 存在しない問題として `notFound()`。`23503`（FK 違反）→ 問題が残るカテゴリーは削除できないメッセージ（`deleteCategories` は 1 文で消すので、1 件でも該当すれば全体が取り消される）。画面側でも問題数（`getCategorySummaries()` の `questionCount`）が 1 以上のカテゴリーはチェックボックスを無効にしている。

## アーキテクチャ

```
src/app/                 ページ（App Router）と Server Actions（各ディレクトリの actions.ts）
  page.tsx               問題一覧 /
  questions/new|[id]|[id]/edit   問題作成・詳細・修正（修正画面は ?from=detail|review で戻り先を切り替え。review なら mode / categoryId も引き継ぎ、?resume=問題ID 付きで戻る）
  categories/            カテゴリー一覧・登録・修正（行内で編集）・削除（チェックしてまとめて削除）
  review/                復習（?mode=today|all|category&categoryId=... で出題タイプを切り替え）
  login|signup|forgot-password|reset-password   認証の画面（幅は max-w-md）
  settings/              個人設定（名前・メールアドレス・パスワードの変更、アカウント削除）
  auth/                  認証の Server Actions（actions.ts）、メールリンクの受け口（confirm/route.ts）、失敗時の案内（error/）
src/proxy.ts             セッション更新と未ログイン時のリダイレクト（中身は src/lib/supabase/proxy.ts）
src/lib/auth.ts          requireUser()（Server Action 用の利用者確認）
src/components/          画面の UI（Client Component 中心）。データとアクションは props で受け取る
src/components/ui/       shadcn/ui の部品（CLI で生成）
src/lib/utils.ts         cn()（shadcn/ui 用のクラス名結合）
src/lib/data/questions.ts   Supabase からの取得（DB の行 → アプリの型への変換もここ）
src/lib/review/          出題日計算（schedule）・正誤判定（judge）・シャッフル（shuffle）・出題タイプ（mode）。純粋関数
src/lib/returnTo.ts      問題修正画面の戻り先（returnPath）と、復習画面からのリンク（editFromReviewHref）。純粋関数
src/lib/validation.ts    フォーム入力の検証（FormData を受け取る純粋関数）
src/lib/types.ts         アプリ内で使う型（Question, Category, ReviewQuestion など）
```

- **ページの形**: `page.tsx` は同期コンポーネントにして見出しなどの静的部分を描画し、データ取得は `async` な `〜Loader` コンポーネントに分けて `<Suspense>` で包む（Cache Components では未キャッシュのデータ取得を Suspense の外で行うとエラーになる）。`params` / `searchParams` も Promise なので Loader 内で `await` する。
- `new Date()` や `Math.random()` をサーバーで使う前には `await connection()`（`next/server`）を呼ぶ（例: `src/app/review/page.tsx`）。
- **Server Actions** はページから Client Component に props で渡す（テストで差し替えるため）。フォームは `useActionState` を使い、エラー時は `{ errors, values }` を返して入力値を復元する（フォームの `key` に state を渡して作り直している）。成功時は `redirect()`、同じ画面のまま再表示したいときは `refresh()`（`next/cache`）。データはキャッシュしていないので `revalidatePath` などは不要。
- **Cache Components では、一度開いた画面は unmount されず React の `<Activity>` で隠したまま残る**（最大 3 画面。state も入力欄の DOM も保持される。`node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`）。同じパスにリンクや `redirect()` で移動すると（検索パラメーターだけが違っても）、**残っていた画面を前回の内容・状態のまま表示し、新しいデータが届いてから差し替える**。そのため、データを表示する画面は次のようにしている。
  - **ページの `<Suspense>` を `ResetOnNavigation`（`src/components/ResetOnNavigation.tsx`）で包む**。`useRouter().bfcacheId` を `key` にして、リンク・`redirect()` での移動では作り直し（読み込み表示 → 新しいデータ）、ブラウザの戻る・進むでは状態を残す。**必ず `<Suspense>` の外側に置く**（内側だと新しいデータが届くまで前回の内容が見える）。新しいページを作るときも同じ形にする。
  - サーバーから受け取った値を `defaultValue` で入れるフォームは、`key` に初期値も含める（`key={JSON.stringify([state, initialValues])}`。例: `QuestionForm`、`SettingsForm`）。表示中にデータが更新されたときも新しい値に作り直すため。
  - URL に更新日時などを付けて別の画面にする方法や、`revalidatePath` では直らなかった（検索パラメーターだけの違いでは同じ画面として再利用され、`revalidatePath` は残った画面の表示を消さない）。
  - `ResetOnNavigation` を含むページを Vitest で描画するときは、ルーターがないので `vi.mock("next/navigation", () => ({ useRouter: () => ({ bfcacheId: "test" }) }))` で差し替える（例: `src/app/page.test.tsx`）。
  - Playwright で確認するときは、隠れた画面も DOM に残っているので `:visible` や `getByRole` で表示中の要素に絞る。
- 引数を `.bind` で Server Action に渡すとクライアントから改ざんできるため、URL などをそのまま受け取らない（例: `updateQuestion` は修正画面の `from` / `mode` / `categoryId` を受け取り、戻り先のパスは `returnPath()` が一覧・詳細・復習のどれかとして組み立てる）。
- 画面遷移とボタン名は要件定義書の画面遷移図（docx 内の画像。①〜⑳）に合わせている。主な対応: ⑤ 個人設定「保存」→ 一覧、⑯ 復習「問題修正」→ 問題修正、⑮ 問題修正「戻る」→ 復習、⑰ 詳細「問題修正」→ 問題修正、⑱ 問題修正「戻る」→ 詳細、⑳ カテゴリー一覧「問題一覧」→ 一覧。② 新規登録「登録」→ 一覧 だけは、メール確認を必須にしたため確認メールのリンク経由になる。
- 削除の確認は `window.confirm` を使う。

### 出題日の計算（`src/lib/review/schedule.ts`）

- 日付はすべて**日本時間の `YYYY-MM-DD` 文字列**で扱う（`toTokyoDate()`）。DB の `next_review_on` も日本時間の日付。
- 作成時はフェーズ1・出題日は作成日の翌日（DB のデフォルト値）。
- 正解: フェーズ1→2（作成日 + 7 日）、2→3（作成日 + 30 日）、3→4（復習完了、出題日 null）。ただし計算した日がもう過ぎていたら翌日にする。
- 不正解: フェーズはそのまま、回答日からフェーズ1 = 1 日、2 = 7 日、3 = 30 日後。
- 「今日の問題」は `next_review_on <= 今日` の問題。解答時のスケジュール更新は、出題日を迎えている問題に限る（二重送信対策）。
- 正誤判定（`judge.ts`）は NFKC 正規化・前後の空白除去・連続する空白をまとめたうえで完全一致。英字の大文字・小文字は区別する。
- 解答の判定はサーバー（`src/app/review/actions.ts` の `submitAnswer`）で行い、復習画面のクライアントには正解を渡さない（`ReviewQuestion` 型）。

### 出題タイプ（`src/lib/review/mode.ts`）

- 「今日の問題」（`today`）・「全問復習」（`all`、全問題をランダム）・「カテゴリー別」（`category`、選んだカテゴリーの問題をランダム）。URL の検索パラメーター `mode` / `categoryId` で切り替え、`parseReviewSelection()` で読み取る（不明な値は `today`）。
- 復習画面の開始前と 0 件のときに `ReviewModeForm`（`next/form` の GET フォーム）を表示する。`ReviewSession` は `selection` を省略すると「今日の問題」として動く。ページは出題タイプごとに `key` を変えて、進み具合を最初からにしている。
- **復習フェーズ・出題日を更新するのは「今日の問題」だけ**。全問復習・カテゴリー別は練習として正誤判定のみ。判定は `shouldUpdateSchedule(mode, question, today)`（`mode === "today"` かつ出題日を迎えている問題）。
- 復習中の「問題修正」（画面遷移図 ⑯）→ 修正画面の「戻る」「修正」（⑮）で、**修正した問題から再開する**（`src/lib/review/progress.ts`）。
  - 「問題修正」を押した時点で出題順・位置・その問題より前の正解数を `sessionStorage`（キー `anki-app:review-progress`）に保存する。解答済みでも、その問題はやり直すので正解数に数えない。
  - 戻り先は `/review?...&resume=問題ID`。ページは `resume` の問題を出題に必ず含める（「今日の問題」で解答済みなら出題日が進んで一覧から外れているため。出題日を迎えていないので、やり直してもスケジュールは進まない）。
  - `ReviewSession` は保存した進み具合を `useSyncExternalStore` で読み（サーバーとハイドレーション時は null）、読めたら `key` を変えて `ReviewSessionView` を作り直す（effect 内の setState は lint の `react-hooks/set-state-in-effect` で禁止されているため）。進み具合が使えないときは修正した問題を 1 問目にして始める。
- `submitAnswer(mode, id, answer)` の `mode` はページで `.bind` して渡すため、クライアントから書き換えられる。それでも出題日を迎えていない問題は進まないので、「今日の問題」で正当に解答した場合と結果は変わらない。

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

## デザインルール
shadcn/ui の導入方法や技術的な注意点は「技術スタックと注意点」を参照。ここでは画面を作るときの見た目の決まりをまとめる。

### 部品の選び方
- UI は **shadcn/ui の部品で組み立てる**。素の `<button>` / `<input>` / `<select>` / `<table>` に Tailwind で直接スタイルを当てない。必要な部品がなければ `npx shadcn@latest add <name>` で追加する。
- `src/components/ui/` のファイルは CLI の生成物として扱い、画面の都合で書き換えない。見た目の調整は使う側の `className` で行う。
- 対応表:
  | 用途 | 使う部品 |
  | --- | --- |
  | 画面の主要なかたまり（一覧・フォーム・詳細・復習） | `Card`（`CardHeader` / `CardContent` / `CardFooter`） |
  | ボタン | `Button`。リンクをボタンの見た目にするときは `Link` + `cn(buttonVariants(...))` |
  | フォーム項目 | `Field` + `FieldLabel` + 入力部品 + `FieldDescription`（補足）/ `FieldError`（エラー）。複数項目は `FieldGroup` で包む |
  | 入力 | `Input` / `Textarea` / `NativeSelect`（`Select` は使わない） / `Checkbox` |
  | 一覧表 | `Table` 系 |
  | 画面全体・フォーム全体のエラー | `Alert variant="destructive"` + `CircleAlert` アイコン |
  | 状態・分類のラベル | `Badge`（カテゴリーは `variant="outline"`、復習フェーズは `PhaseBadge`） |
  | 読み込み中 | `LoadingCard`（`Skeleton`） |
  | 進み具合 | `Progress` |

### ページ構成
- ページ（`page.tsx`）は `<main className="mx-auto flex w-full max-w-… flex-col gap-6 px-4 py-8 sm:py-10">` で包む。幅は一覧 `max-w-5xl`、詳細 `max-w-3xl`、フォーム・復習など 1 列の画面は `max-w-2xl`、認証の画面（ログイン・新規登録など）は `max-w-md`。
- 見出しは必ず `PageHeader`（`title` は `<h1>`、`description` に 1 文の説明、右側の操作ボタンは `actions`）。ページ内で `<h1>` を直接書かない。
- ヘッダー（`AppHeader`）は `layout.tsx` で全画面共通に表示する。画面間のナビゲーションボタンはヘッダーではなく各ページの `PageHeader` の `actions` やカード下部に置く（テストがページ単位でリンクを検証しているため）。
- `<Suspense>` の fallback は `LoadingCard` に統一する。

### ボタンとリンク
- 1 つの画面で **主要な操作（作成・登録・送信・復習スタートなど）は 1 つだけ `variant="default"`**（インディゴ塗り）にする。
- 「戻る」「カテゴリー」など補助的な遷移は `variant="outline"`、表の行内操作（詳細・修正）や「復習終了」は `variant="ghost"` + `size="sm"`。
- 削除は `variant="destructive"`（薄い赤背景）。確認は従来どおり `window.confirm`。
- カードの下部（`CardFooter`）は「戻る」を左、主要な操作を右に置く。
- ボタンには内容を表す `lucide-react` のアイコンを文字の前に付ける（「次の問題へ」「結果を見る」など先へ進む操作だけは後ろに `ArrowRight`）。主なアイコン: 作成 `Plus`、戻る `ArrowLeft`、修正 `Pencil`、削除 `Trash2`、詳細 `Eye`、復習 `BrainCircuit`、カテゴリー `FolderOpen` / `Folder`、送信 `Send`。
- ボタン内のアイコンはサイズを指定しない（`Button` が `size-4` にそろえる）。アイコンは装飾なので、アクセシブルな名前は文字で付ける（アイコンだけのボタンにしない）。

### 色
- 色は **テーマのトークンだけを使う**（`bg-primary` / `text-muted-foreground` / `text-destructive` / `bg-success` / `border` など）。`bg-blue-600` や `text-zinc-600` のような Tailwind の固定色は使わない。新しい意味の色が必要ならトークンを `globals.css` に追加する（例: `--success`）。
- 意味の割り当て:
  - `primary`（インディゴ）: 主要な操作、ブランド、進み具合、強調したい数値。
  - `success`（緑）: 正解、復習完了（フェーズ4）。
  - `destructive`（赤）: 不正解、削除、エラー。
  - `muted-foreground`: 補足説明、日付などの二次情報、空の状態の説明文。
  - `accent`: 解答など、本文の中で区別して見せたい領域の背景。
- 淡い色の背景は不透明度で作る（`bg-primary/10`、`bg-success/15` など）。復習フェーズは数字が大きいほど濃くする（`PhaseBadge`）。

### 文字と余白
- 見出しは `PageHeader` の `text-2xl sm:text-3xl font-bold`。カード内の見出しは `CardTitle`。
- 問題文は大きく太く（詳細 `text-lg font-semibold`、復習 `text-xl font-semibold`）、ラベルは小さく薄く（`text-xs text-muted-foreground`）して、内容を主役にする。
- 日付や件数などの数字には `tabular-nums` を付ける。複数行入力される問題・解答の表示には `whitespace-pre-wrap` を付ける。
- 余白は Tailwind のスケールで `gap-*` を使って取る（`space-*` や個別の `margin` より `flex` / `grid` + `gap` を優先）。画面内のカード同士は `gap-6`。
- 角丸・影はカードと部品の既定値に任せ、独自の `rounded-*` / `shadow-*` を足さない。

### 空の状態・エラー・フィードバック
- データが 0 件のときは、カードの中央にアイコン（`size-12〜14` の丸背景 + アイコン）、太字の一文、薄い補足文、必要なら次の操作へのボタンを並べる（`QuestionList` / `ReviewSession` を参照）。
- 入力エラーは項目の下に `FieldError` で出し、`Field` に `data-invalid`、入力部品に `aria-invalid` を付けて枠を赤くする。保存失敗などフォーム全体のエラーは先頭に `Alert` で出す。
- 正誤や完了などの結果は、色だけでなくアイコンと文字（「○ 正解」「× 不正解」）でも伝える。

### レスポンシブ
- スマートフォン幅（390px 程度）でページ全体が横にスクロールしないこと。横に長い表はカードの中で横スクロールさせる（`Table` が自動で包む）。
- 横並びは `flex-wrap` で折り返せるようにする。幅の切り替えは `sm:` 以上で行う（モバイルを基準に書く）。

### テストとの両立
- デザインを変えるときも、テストが参照するラベル文言・ボタン名・リンク名・要素の役割（`role`）は変えない。`getByText` は 1 つの要素の直下の文字で一致を見るため、「今日の問題は 2 問です」「あなたの解答：…」のような文を `<span>` で分割して装飾しない。
- `Alert` と `FieldError` は `role="alert"` を持つ。1 画面に同時に複数出るとテストの `getByRole("alert")` が失敗するので、エラー表示を増やすときは注意する。

### 確認方法
- 見た目を変えたら、Playwright MCP で該当画面をデスクトップ幅とスマートフォン幅（390px）の両方でスクリーンショットを撮って確認する。

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

