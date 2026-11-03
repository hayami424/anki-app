import { describe, expect, test } from "vitest";
import { editFromReviewHref, returnPath } from "./returnTo";

describe("returnPath", () => {
  test("指定がなければ問題一覧に戻る", () => {
    expect(returnPath("q1", {})).toBe("/");
  });

  test("from=detail なら問題詳細に戻る", () => {
    expect(returnPath("q1", { from: "detail" })).toBe("/questions/q1");
  });

  test("from=review なら今日の問題の復習画面に戻り、修正した問題から再開する", () => {
    expect(returnPath("q1", { from: "review" })).toBe("/review?resume=q1");
  });

  test("from=review で出題タイプがあれば、同じ出題タイプの復習画面に戻る", () => {
    expect(returnPath("q1", { from: "review", mode: "all" })).toBe("/review?mode=all&resume=q1");
    expect(returnPath("q1", { from: "review", mode: "category", categoryId: "history" })).toBe(
      "/review?mode=category&categoryId=history&resume=q1",
    );
  });

  test("不明な from は問題一覧に戻る", () => {
    expect(returnPath("q1", { from: "https://evil.example" })).toBe("/");
  });

  test("不明な出題タイプは今日の問題として扱う", () => {
    expect(returnPath("q1", { from: "review", mode: "//evil.example" })).toBe("/review?resume=q1");
  });

  test("カテゴリー ID などに含まれる記号はエンコードする", () => {
    expect(
      returnPath("q1", { from: "review", mode: "category", categoryId: "a&from=x" }),
    ).toBe("/review?mode=category&categoryId=a%26from%3Dx&resume=q1");
  });
});

describe("editFromReviewHref", () => {
  test("今日の問題からは from=review だけを付ける", () => {
    expect(editFromReviewHref("q1", { mode: "today" })).toBe("/questions/q1/edit?from=review");
  });

  test("出題タイプとカテゴリーを引き継ぐ", () => {
    expect(editFromReviewHref("q1", { mode: "category", categoryId: "history" })).toBe(
      "/questions/q1/edit?mode=category&categoryId=history&from=review",
    );
  });

  test("リンク先から戻ると元の出題タイプの復習画面になる", () => {
    const href = editFromReviewHref("q1", { mode: "all" });
    const params = Object.fromEntries(new URL(href, "http://localhost").searchParams);

    expect(returnPath("q1", params)).toBe("/review?mode=all&resume=q1");
  });
});
