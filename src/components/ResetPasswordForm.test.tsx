import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AuthFormState } from "@/lib/types";
import { ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  test("入力した新しいパスワードをアクションに送信する", async () => {
    const user = userEvent.setup();
    const resetPasswordAction = vi.fn<
      (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>
    >(async () => ({}));
    render(<ResetPasswordForm resetPasswordAction={resetPasswordAction} />);

    await user.type(screen.getByLabelText("新しいパスワード"), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));

    expect(resetPasswordAction.mock.calls[0][1].get("password")).toBe("Abcdef1!");
  });

  test("変更に失敗するとエラーを表示する", async () => {
    const user = userEvent.setup();
    render(
      <ResetPasswordForm
        resetPasswordAction={vi.fn(async () => ({
          errors: { form: "現在と同じパスワードは設定できません" },
        }))}
      />,
    );

    await user.type(screen.getByLabelText("新しいパスワード"), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: "パスワードを変更" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "現在と同じパスワードは設定できません",
    );
  });
});
