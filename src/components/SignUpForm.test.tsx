import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthFormState } from "@/lib/types";
import { SignUpForm } from "./SignUpForm";

function renderForm(
  signUpAction = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>(
    async () => ({}),
  ),
) {
  render(<SignUpForm signUpAction={signUpAction} />);
  return { signUpAction };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("名前"), "山田太郎");
  await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
  await user.type(screen.getByLabelText("パスワード"), "Abcdef1!");
  await user.click(screen.getByRole("button", { name: "登録" }));
}

describe("SignUpForm", () => {
  test("入力した名前・メールアドレス・パスワードをアクションに送信する", async () => {
    const user = userEvent.setup();
    const { signUpAction } = renderForm();

    await fillAndSubmit(user);

    const formData = signUpAction.mock.calls[0][1];
    expect(formData.get("name")).toBe("山田太郎");
    expect(formData.get("email")).toBe("taro@example.com");
    expect(formData.get("password")).toBe("Abcdef1!");
  });

  test("パスワードの条件を補足として表示する", () => {
    renderForm();

    expect(
      screen.getByText("英小文字・英大文字・数字・記号をすべて含む8文字以上"),
    ).toBeInTheDocument();
  });

  test("確認メールを送信できたら案内とログイン画面へのリンクを表示する", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn(async () => ({ sent: true })));

    await fillAndSubmit(user);

    expect(await screen.findByText("確認メールを送信しました")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ログイン画面へ" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("button", { name: "登録" })).not.toBeInTheDocument();
  });

  test("入力エラーがあるとエラーを表示し、名前とメールアドレスを復元する", async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn(async () => ({
        errors: {
          password:
            "パスワードは英小文字・英大文字・数字・記号をすべて含む8文字以上で入力してください",
        },
        values: { name: "山田太郎", email: "taro@example.com" },
      })),
    );

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("8文字以上で入力してください");
    expect(screen.getByLabelText("名前")).toHaveValue("山田太郎");
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("taro@example.com");
    expect(screen.getByLabelText("パスワード")).toHaveValue("");
  });

  test("「戻る」でログイン画面に戻る", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/login");
  });
});
