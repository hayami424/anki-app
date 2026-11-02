import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

// ヘッダー右側のログイン中の利用者・プロフィール・ログアウト。未ログインなら何も出さない
export async function UserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const displayName = data.claims.user_metadata?.display_name;

  return (
    <div className="flex items-center gap-1">
      {typeof displayName === "string" && (
        <span className="mr-1 hidden text-sm text-muted-foreground sm:inline">
          {displayName} さん
        </span>
      )}
      <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} href="/settings">
        <UserRound />
        プロフィール
      </Link>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
