import { afterEach, describe, expect, test, vi } from "vitest";
import { checkSupabaseConnection } from "./checkConnection";

const url = "https://example.supabase.co";
const key = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("ヘルスチェックが 200 を返すと接続成功になる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection(url, key);

    expect(result).toEqual({ ok: true, url });
    expect(fetchMock).toHaveBeenCalledWith(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    });
  });

  test("ヘルスチェックが 401 を返すとステータス付きで接続失敗になる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

    const result = await checkSupabaseConnection(url, key);

    expect(result).toEqual({ ok: false, reason: "HTTP 401" });
  });

  test("ネットワークエラーが発生するとエラーメッセージ付きで接続失敗になる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection(url, key);

    expect(result).toEqual({ ok: false, reason: "fetch failed" });
  });

  test.each([
    ["URL が未設定", undefined, key],
    ["キーが未設定", url, undefined],
    ["URL が空文字", "", key],
    ["キーが空文字", url, ""],
  ])("%s の場合は通信せずに接続失敗になる", async (_label, u, k) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection(u, k);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
