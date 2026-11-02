import { describe, expect, test } from "vitest";
import {
  validateCategoryName,
  validateEmailInput,
  validateLogin,
  validateNewPassword,
  validatePassword,
  validateProfile,
  validateQuestionInput,
  validateSignUp,
} from "./validation";

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

function authForm(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

const validPassword = "Abcdef1!";

describe("validatePassword", () => {
  test("英小文字・英大文字・数字・記号を含む 8 文字ならエラーにならない", () => {
    expect(validatePassword(validPassword)).toBeUndefined();
  });

  test("条件を満たしていても 7 文字ならエラーになる", () => {
    expect(validatePassword("Abcde1!")).toMatch(/8文字以上/);
  });

  test.each([
    ["英小文字", "ABCDEF1!"],
    ["英大文字", "abcdef1!"],
    ["数字", "Abcdefg!"],
    ["記号", "Abcdefg1"],
  ])("%sを含まなければエラーになる", (_label, password) => {
    expect(validatePassword(password)).toMatch(/すべて含む/);
  });

  test("空ならパスワードの入力を求める", () => {
    expect(validatePassword("")).toBe("パスワードを入力してください");
  });
});

describe("validateSignUp", () => {
  test("すべての項目が正しければ、名前とメールアドレスの前後の空白を除いて返す", () => {
    const result = validateSignUp(
      authForm({ name: " 山田 ", email: " taro@example.com ", password: validPassword }),
    );

    expect(result).toEqual({
      ok: true,
      value: { name: "山田", email: "taro@example.com", password: validPassword },
    });
  });

  test("名前が空、メールアドレスの形式が不正、パスワードが条件外ならそれぞれエラーになる", () => {
    const result = validateSignUp(authForm({ name: " ", email: "taro", password: "abc" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe("名前を入力してください");
    expect(result.errors.email).toBe("メールアドレスの形式が正しくありません");
    expect(result.errors.password).toMatch(/8文字以上/);
  });

  test("名前は 50 文字ちょうどなら登録でき、51 文字ならエラーになる", () => {
    const base = { email: "taro@example.com", password: validPassword };
    expect(validateSignUp(authForm({ ...base, name: "あ".repeat(50) })).ok).toBe(true);

    const result = validateSignUp(authForm({ ...base, name: "あ".repeat(51) }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe("名前は50文字以内で入力してください");
  });

  test("エラー時は名前とメールアドレスを返し、パスワードは返さない", () => {
    const result = validateSignUp(authForm({ name: "山田", email: "taro", password: "secret" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.values).toEqual({ name: "山田", email: "taro" });
  });
});

describe("validateLogin", () => {
  test("メールアドレスとパスワードがあれば、パスワードの形式は問わない", () => {
    const result = validateLogin(authForm({ email: "taro@example.com", password: "old" }));

    expect(result).toEqual({ ok: true, value: { email: "taro@example.com", password: "old" } });
  });

  test("項目が送信されていなければそれぞれエラーになる", () => {
    const result = validateLogin(authForm({}));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      email: "メールアドレスを入力してください",
      password: "パスワードを入力してください",
    });
  });
});

describe("validateEmailInput", () => {
  test("正しい形式のメールアドレスなら前後の空白を除いて返す", () => {
    expect(validateEmailInput(authForm({ email: " taro@example.com " }))).toEqual({
      ok: true,
      value: { email: "taro@example.com" },
    });
  });

  test("ドメインに . がなければエラーになる", () => {
    const result = validateEmailInput(authForm({ email: "taro@example" }));
    expect(result.ok).toBe(false);
  });
});

describe("validateNewPassword", () => {
  test("条件を満たすパスワードならそのまま返す", () => {
    expect(validateNewPassword(authForm({ password: validPassword }))).toEqual({
      ok: true,
      value: { password: validPassword },
    });
  });

  test("条件を満たさなければエラーになる", () => {
    const result = validateNewPassword(authForm({ password: "password" }));
    expect(result.ok).toBe(false);
  });
});

describe("validateProfile", () => {
  const base = { name: "山田太郎", email: "taro@example.com" };

  test("パスワードが空なら変更しない（null）として返す", () => {
    expect(validateProfile(authForm({ ...base, password: "" }))).toEqual({
      ok: true,
      value: { name: "山田太郎", email: "taro@example.com", password: null },
    });
  });

  test("パスワードを入力した場合は条件を満たせばそのまま返す", () => {
    const result = validateProfile(authForm({ ...base, password: validPassword }));

    expect(result).toEqual({
      ok: true,
      value: { name: "山田太郎", email: "taro@example.com", password: validPassword },
    });
  });

  test("入力したパスワードが条件を満たさなければエラーになる", () => {
    const result = validateProfile(authForm({ ...base, password: "short" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.password).toMatch(/8文字以上/);
  });

  test("名前が空、メールアドレスの形式が不正ならエラーになり、入力値を返す", () => {
    const result = validateProfile(authForm({ name: " ", email: "taro", password: "" }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe("名前を入力してください");
    expect(result.errors.email).toBe("メールアドレスの形式が正しくありません");
    expect(result.values).toEqual({ name: " ", email: "taro" });
  });
});
