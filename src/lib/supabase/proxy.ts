import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// ログインしていなくても開ける画面
const publicPaths = ["/login", "/signup", "/forgot-password", "/auth"];
// ログイン済みなら開く必要のない画面
const guestOnlyPaths = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// 期限切れのアクセストークンを更新して cookie に書き戻し、ログイン状態に応じて画面を振り分ける
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // createServerClient と getClaims の間に処理を挟まないこと（トークン更新が漏れてログアウトされる原因になる）
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  let redirectTo: string | undefined;
  if (!isLoggedIn && !matches(pathname, publicPaths)) redirectTo = "/login";
  if (isLoggedIn && matches(pathname, guestOnlyPaths)) redirectTo = "/";
  if (redirectTo === undefined) return response;

  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  // 更新したトークンをリダイレクト先にも引き継ぐ
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}
