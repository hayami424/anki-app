import { describe, expect, test } from "vitest";
import { safeNextPath } from "./safeNextPath";

describe("safeNextPath", () => {
  test("アプリ内のパスならそのまま返す", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/questions/1?from=detail")).toBe("/questions/1?from=detail");
  });

  test("指定がなければトップに戻す", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  test.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "外部に飛ぶ可能性のある %s はトップに置き換える",
    (next) => {
      expect(safeNextPath(next)).toBe("/");
    },
  );
});
