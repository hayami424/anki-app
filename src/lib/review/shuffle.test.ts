import { describe, expect, test } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  test("要素の過不足なく並べ替えた新しい配列を返す", () => {
    const items = [1, 2, 3, 4, 5];

    const result = shuffle(items);

    expect(result).not.toBe(items);
    expect(result.toSorted()).toEqual([1, 2, 3, 4, 5]);
  });

  test("元の配列は変更しない", () => {
    const items = [1, 2, 3];

    shuffle(items, () => 0);

    expect(items).toEqual([1, 2, 3]);
  });

  test("乱数に応じて順序を入れ替える", () => {
    // 常に先頭と入れ替える乱数では、各ステップで末尾側の要素が先頭へ移る
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });

  test("空の配列と要素 1 つの配列はそのまま返す", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["a"])).toEqual(["a"]);
  });
});
