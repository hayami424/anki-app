import { describe, expect, test } from "vitest";
import type { ReviewQuestion } from "@/lib/types";
import { parseSavedProgress, restoreProgress, type SavedProgress } from "./progress";

function question(id: string): ReviewQuestion {
  return { id, question: `問題${id}`, categoryName: "日本史" };
}

const selectionKey = JSON.stringify({ mode: "all" });

describe("restoreProgress", () => {
  const saved: SavedProgress = {
    selectionKey,
    order: ["a", "b", "c", "d"],
    index: 1,
    correctCount: 1,
  };

  test("保存した出題順・位置・正解数を引き継ぎ、修正した問題から再開する", () => {
    const restored = restoreProgress(
      saved,
      selectionKey,
      [question("d"), question("c"), question("b"), question("a")],
      "b",
    );

    expect(restored?.questions.map((q) => q.id)).toEqual(["a", "b", "c", "d"]);
    expect(restored?.index).toBe(1);
    expect(restored?.correctCount).toBe(1);
    expect(restored?.questions[1]).toEqual(question("b"));
  });

  test("解答済みで一覧から外れた問題は ID だけで埋め、位置を保つ", () => {
    const restored = restoreProgress(saved, selectionKey, [question("b"), question("c")], "b");

    expect(restored?.questions.map((q) => q.id)).toEqual(["a", "b", "c"]);
    expect(restored?.index).toBe(1);
  });

  test("これから出題する問題のうち削除されたものは除く", () => {
    const restored = restoreProgress(
      saved,
      selectionKey,
      [question("a"), question("b"), question("d")],
      "b",
    );

    expect(restored?.questions.map((q) => q.id)).toEqual(["a", "b", "d"]);
  });

  test("出題タイプが違えば引き継がず、修正した問題を先頭にして最初から出題する", () => {
    const restored = restoreProgress(
      saved,
      JSON.stringify({ mode: "today" }),
      [question("a"), question("b"), question("c")],
      "b",
    );

    expect(restored).toEqual({
      questions: [question("b"), question("a"), question("c")],
      index: 0,
      correctCount: 0,
    });
  });

  test("保存した位置の問題が修正した問題と違えば引き継がない", () => {
    const restored = restoreProgress(saved, selectionKey, [question("a"), question("c")], "c");

    expect(restored?.index).toBe(0);
    expect(restored?.questions[0].id).toBe("c");
  });

  test("保存した進み具合がなければ修正した問題を先頭にする", () => {
    const restored = restoreProgress(null, selectionKey, [question("a"), question("b")], "b");

    expect(restored?.questions.map((q) => q.id)).toEqual(["b", "a"]);
  });

  test("修正した問題が出題対象にない（削除されたなど）なら再開しない", () => {
    expect(restoreProgress(saved, selectionKey, [question("a")], "b")).toBeNull();
  });
});

describe("parseSavedProgress", () => {
  test("保存した JSON を読み取る", () => {
    const saved: SavedProgress = { selectionKey, order: ["a"], index: 0, correctCount: 0 };
    expect(parseSavedProgress(JSON.stringify(saved))).toEqual(saved);
  });

  test.each([null, "", "壊れた値", JSON.stringify({ order: "a" }), JSON.stringify([1, 2])])(
    "%s は保存されていないものとして扱う",
    (text) => {
      expect(parseSavedProgress(text)).toBeNull();
    },
  );
});
