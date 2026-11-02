import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthFormState } from "@/lib/types";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

function renderForm(
  requestPasswordResetAction = vi.fn<
    (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>
  >(async () => ({})),
) {
  render(<ForgotPasswordForm requestPasswordResetAction={requestPasswordResetAction} />);
  return { requestPasswordResetAction };
}

describe("ForgotPasswordForm", () => {
  test("入力したメールアドレスをアクションに送信する", async () => {
    const user = userEvent.setup();
    const { requestPasswordResetAction } = renderForm();

    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(requestPasswordResetAction.mock.calls[0][1].get("email")).toBe("taro@example.com");
  });

  test("送信できたら案内を表示する", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn(async () => ({ sent: true })));

    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(await screen.findByText("再設定メールを送信しました")).toBeInTheDocument();
  });

  test("エラーがあるとエラーを表示し、入力値を復元する", async () => {
    const user = userEvent.setup();
    renderForm(
      vi.fn(async () => ({
        errors: { email: "メールアドレスの形式が正しくありません" },
        values: { name: "", email: "taro" },
      })),
    );

    await user.type(screen.getByLabelText("メールアドレス"), "taro");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスの形式が正しくありません",
    );
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("taro");
  });

  test("「戻る」でログイン画面に戻る", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/login");
  });
});
