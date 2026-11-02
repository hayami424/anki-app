import { describe, expect, test } from "vitest";
import { parseReviewSelection, shouldUpdateSchedule } from "./mode";

describe("parseReviewSelection", () => {
  test("指定がなければ「今日の問題」になる", () => {
    expect(parseReviewSelection({})).toEqual({ mode: "today" });
  });

  test("mode=all なら「全問復習」になる", () => {
    expect(parseReviewSelection({ mode: "all" })).toEqual({ mode: "all" });
  });

  test("mode=category ならカテゴリー ID とともに「カテゴリー別」になる", () => {
    expect(parseReviewSelection({ mode: "category", categoryId: "history" })).toEqual({
      mode: "category",
      categoryId: "history",
    });
  });

  test("カテゴリー別でカテゴリー ID が空なら未選択（null）になる", () => {
    expect(parseReviewSelection({ mode: "category", categoryId: "" })).toEqual({
      mode: "category",
      categoryId: null,
    });
    expect(parseReviewSelection({ mode: "category" })).toEqual({
      mode: "category",
      categoryId: null,
    });
  });

  test("不明な mode は「今日の問題」として扱う", () => {
    expect(parseReviewSelection({ mode: "unknown" })).toEqual({ mode: "today" });
  });

  test("同じパラメーターが複数ある場合は最初の値を使う", () => {
    expect(parseReviewSelection({ mode: ["all", "today"] })).toEqual({ mode: "all" });
  });
});

describe("shouldUpdateSchedule", () => {
  const today = "2026-11-03";

  test("「今日の問題」で出題日を迎えている問題なら更新する", () => {
    expect(shouldUpdateSchedule("today", { nextReviewOn: "2026-11-03" }, today)).toBe(true);
    expect(shouldUpdateSchedule("today", { nextReviewOn: "2026-11-01" }, today)).toBe(true);
  });

  test("「今日の問題」でも出題日が明日以降なら更新しない", () => {
    expect(shouldUpdateSchedule("today", { nextReviewOn: "2026-11-04" }, today)).toBe(false);
  });

  test("復習完了（出題日なし）の問題は更新しない", () => {
    expect(shouldUpdateSchedule("today", { nextReviewOn: null }, today)).toBe(false);
  });

  test.each(["all", "category", "unknown"])(
    "%s では出題日を迎えていても更新しない",
    (mode) => {
      expect(shouldUpdateSchedule(mode, { nextReviewOn: "2026-11-01" }, today)).toBe(false);
    },
  );
});
