import { describe, expect, test } from "vitest";
import { isCorrectAnswer } from "./judge";

describe("isCorrectAnswer", () => {
  test("解答と正解が一致すれば正解になる", () => {
    expect(isCorrectAnswer("徳川家康", "徳川家康")).toBe(true);
  });

  test("解答と正解が異なれば不正解になる", () => {
    expect(isCorrectAnswer("豊臣秀吉", "徳川家康")).toBe(false);
  });

  test("前後の空白は無視して判定する", () => {
    expect(isCorrectAnswer("  徳川家康\n", "徳川家康")).toBe(true);
  });

  test("全角英数字と半角英数字は同じ文字として判定する", () => {
    expect(isCorrectAnswer("ＡＢＣ１２３", "ABC123")).toBe(true);
  });

  test("連続する空白は 1 つの空白として判定する", () => {
    expect(isCorrectAnswer("New   York", "New York")).toBe(true);
  });

  test("英字の大文字・小文字は区別する", () => {
    expect(isCorrectAnswer("apple", "Apple")).toBe(false);
  });

  test("空の解答は不正解になる", () => {
    expect(isCorrectAnswer("", "徳川家康")).toBe(false);
    expect(isCorrectAnswer("   ", "徳川家康")).toBe(false);
  });
});
