import { describe, expect, test } from "vitest";
import { validateCategoryName, validateQuestionInput } from "./validation";

function questionForm(fields: Record<string, string>) {
  const formData = new FormData();
  const defaults = {
    categoryId: "category-1",
    question: "江戸幕府を開いたのは？",
    answer: "徳川家康",
    url: "",
  };
  Object.entries({ ...defaults, ...fields }).forEach(([key, value]) =>
    formData.set(key, value),
  );
  return formData;
}

describe("validateQuestionInput", () => {
  test("すべての項目が正しければ、前後の空白を除いた値を返す", () => {
    const result = validateQuestionInput(
      questionForm({
        question: "  江戸幕府を開いたのは？ ",
        answer: " 徳川家康 ",
        url: " https://example.com/edo ",
      }),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        categoryId: "category-1",
        question: "江戸幕府を開いたのは？",
        answer: "徳川家康",
        url: "https://example.com/edo",
      },
    });
  });

  test("URL が空なら null として扱う", () => {
    const result = validateQuestionInput(questionForm({ url: "  " }));

    expect(result).toMatchObject({ ok: true, value: { url: null } });
  });

  test("カテゴリーが未選択ならエラーになる", () => {
    const result = validateQuestionInput(questionForm({ categoryId: "" }));

    expect(result).toMatchObject({
      ok: false,
      errors: { categoryId: "カテゴリーを選択してください" },
    });
  });

  test("問題と解答が空白のみならそれぞれエラーになる", () => {
    const result = validateQuestionInput(
      questionForm({ question: "   ", answer: "" }),
    );

    expect(result).toMatchObject({
      ok: false,
      errors: {
        question: "問題を入力してください",
        answer: "解答を入力してください",
      },
    });
  });

  test("問題と解答は 1000 文字ちょうどなら登録できる", () => {
    const result = validateQuestionInput(
      questionForm({ question: "あ".repeat(1000), answer: "い".repeat(1000) }),
    );

    expect(result.ok).toBe(true);
  });

  test("問題と解答が 1001 文字以上ならエラーになる", () => {
    const result = validateQuestionInput(
      questionForm({ question: "あ".repeat(1001), answer: "い".repeat(1001) }),
    );

    expect(result).toMatchObject({
      ok: false,
      errors: {
        question: "問題は1000文字以内で入力してください",
        answer: "解答は1000文字以内で入力してください",
      },
    });
  });

  test.each(["example.com", "ftp://example.com", "javascript:alert(1)"])(
    "URL が http/https 形式でない場合（%s）はエラーになる",
    (url) => {
      const result = validateQuestionInput(questionForm({ url }));

      expect(result).toMatchObject({
        ok: false,
        errors: {
          url: "URLは http:// または https:// で始まる形式で入力してください",
        },
      });
    },
  );

  test("エラー時は入力値をそのまま返す", () => {
    const result = validateQuestionInput(
      questionForm({ question: "", answer: "徳川家康" }),
    );

    expect(result).toMatchObject({
      ok: false,
      values: { categoryId: "category-1", question: "", answer: "徳川家康", url: "" },
    });
  });

  test("項目が送信されていなければ空として扱いエラーになる", () => {
    const result = validateQuestionInput(new FormData());

    expect(result).toMatchObject({
      ok: false,
      errors: {
        categoryId: "カテゴリーを選択してください",
        question: "問題を入力してください",
        answer: "解答を入力してください",
      },
    });
  });
});

describe("validateCategoryName", () => {
  function categoryForm(name: string) {
    const formData = new FormData();
    formData.set("name", name);
    return formData;
  }

  test("前後の空白を除いたカテゴリー名を返す", () => {
    expect(validateCategoryName(categoryForm("  日本史 "))).toEqual({
      ok: true,
      value: "日本史",
    });
  });

  test("カテゴリー名が空白のみならエラーになる", () => {
    expect(validateCategoryName(categoryForm("   "))).toEqual({
      ok: false,
      error: "カテゴリー名を入力してください",
    });
  });

  test("カテゴリー名は 50 文字ちょうどなら登録できる", () => {
    expect(validateCategoryName(categoryForm("あ".repeat(50))).ok).toBe(true);
  });

  test("カテゴリー名が 51 文字以上ならエラーになる", () => {
    expect(validateCategoryName(categoryForm("あ".repeat(51)))).toEqual({
      ok: false,
      error: "カテゴリー名は50文字以内で入力してください",
    });
  });
});
