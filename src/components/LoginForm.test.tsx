import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthFormState } from "@/lib/types";
import { LoginForm } from "./LoginForm";

function renderForm(
  loginAction = vi.fn<(prev: AuthFormState, formData: FormData) => Promise<AuthFormState>>(
    async () => ({}),
  ),
) {
  render(<LoginForm loginAction={loginAction} />);
  return { loginAction };
}

describe("LoginForm", () => {
  test("入力したメールアドレスとパスワードをアクションに送信する", async () => {
    const user = userEvent.setup();
    const { loginAction } = renderForm();

    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.type(screen.getByLabelText("パスワード"), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(loginAction).toHaveBeenCalledTimes(1);
    const formData = loginAction.mock.calls[0][1];
    expect(formData.get("email")).toBe("taro@example.com");
    expect(formData.get("password")).toBe("Abcdef1!");
  });

  test("ログインに失敗するとエラーを表示し、メールアドレスだけを復元する", async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn(async () => ({
        errors: { form: "メールアドレスまたはパスワードが正しくありません" },
        values: { name: "", email: "taro@example.com" },
      })),
    );

    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスまたはパスワードが正しくありません",
    );
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("taro@example.com");
    expect(screen.getByLabelText("パスワード")).toHaveValue("");
  });

  test("項目ごとのエラーを入力欄の下に表示し、入力欄を赤くする", async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn(async () => ({
        errors: { email: "メールアドレスを入力してください" },
        values: { name: "", email: "" },
      })),
    );

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText("メールアドレスを入力してください")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveAttribute("aria-invalid", "true");
  });

  test("新規登録とパスワード再設定の画面へのリンクがある", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "新規登録" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "パスワードを忘れた方" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
