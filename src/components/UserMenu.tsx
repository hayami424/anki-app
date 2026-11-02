import { LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// ヘッダー右側のログイン中の利用者とログアウトボタン。未ログインなら何も出さない
export async function UserMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const displayName = data.claims.user_metadata?.display_name;

  return (
    <div className="flex items-center gap-2">
      {typeof displayName === "string" && (
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <UserRound className="size-4" />
          {displayName}
        </span>
      )}
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
