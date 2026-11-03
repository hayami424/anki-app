import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm, type SettingsFormState } from "./SettingsForm";

const initialValues = { name: "山田太郎", email: "taro@example.com" };

function renderForm(props: Partial<Parameters<typeof SettingsForm>[0]> = {}) {
  const updateProfileAction = vi.fn<
    (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>
  >(async () => ({}));
  const deleteAccountAction = vi.fn<() => Promise<{ error?: string }>>(async () => ({}));
  render(
    <SettingsForm
      initialValues={initialValues}
      updateProfileAction={updateProfileAction}
      deleteAccountAction={deleteAccountAction}
      {...props}
    />,
  );
  return { updateProfileAction, deleteAccountAction };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsForm", () => {
  test("現在の名前とメールアドレスを入力欄に表示し、パスワード欄は空にする", () => {
    renderForm();

    expect(screen.getByLabelText("名前")).toHaveValue("山田太郎");
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("taro@example.com");
    expect(screen.getByLabelText("新しいパスワード（変更する場合のみ）")).toHaveValue("");
  });

  test("変更した名前・メールアドレス・パスワードをアクションに送信する", async () => {
    const user = userEvent.setup();
    const { updateProfileAction } = renderForm();

    await user.clear(screen.getByLabelText("名前"));
    await user.type(screen.getByLabelText("名前"), "山田花子");
    await user.clear(screen.getByLabelText("メールアドレス"));
    await user.type(screen.getByLabelText("メールアドレス"), "hanako@example.com");
    await user.type(screen.getByLabelText("新しいパスワード（変更する場合のみ）"), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: "保存" }));

    const formData = updateProfileAction.mock.calls[0][1];
    expect(formData.get("name")).toBe("山田花子");
    expect(formData.get("email")).toBe("hanako@example.com");
    expect(formData.get("password")).toBe("Abcdef1!");
  });

  test("保存できたら案内を表示し、パスワード欄を空に戻す", async () => {
    const user = userEvent.setup();
    renderForm({
      updateProfileAction: vi.fn(async () => ({
        values: { name: "山田花子", email: "taro@example.com" },
        notice: "保存しました",
      })),
    });

    await user.type(screen.getByLabelText("新しいパスワード（変更する場合のみ）"), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("保存しました");
    expect(screen.getByLabelText("名前")).toHaveValue("山田花子");
    expect(screen.getByLabelText("新しいパスワード（変更する場合のみ）")).toHaveValue("");
  });

  test("入力エラーがあると項目の下にエラーを表示し、入力値を復元する", async () => {
    const user = userEvent.setup();
    renderForm({
      updateProfileAction: vi.fn(async () => ({
        errors: { email: "このメールアドレスは既に使われています" },
        values: { name: "山田太郎", email: "used@example.com" },
      })),
    });

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("このメールアドレスは既に使われています")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("used@example.com");
    expect(screen.getByLabelText("メールアドレス")).toHaveAttribute("aria-invalid", "true");
  });

  test("アカウント削除の確認でキャンセルすると削除しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { deleteAccountAction } = renderForm();

    await user.click(screen.getByRole("button", { name: "アカウントを削除" }));

    expect(deleteAccountAction).not.toHaveBeenCalled();
  });

  test("アカウント削除の確認で OK を押すと削除する", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteAccountAction } = renderForm();

    await user.click(screen.getByRole("button", { name: "アカウントを削除" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("元に戻せません"));
    expect(deleteAccountAction).toHaveBeenCalledTimes(1);
  });

  test("アカウントの削除に失敗するとエラーを表示する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderForm({
      deleteAccountAction: vi.fn(async () => ({ error: "アカウントの削除に失敗しました" })),
    });

    await user.click(screen.getByRole("button", { name: "アカウントを削除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("アカウントの削除に失敗しました");
  });

  test("「戻る」で問題一覧に戻る", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/");
  });
});

describe("SettingsForm を開き直したとき", () => {
  test("サーバーから届く名前が変わったら、新しい名前を表示する", async () => {
    const user = userEvent.setup();
    const props = {
      updateProfileAction: vi.fn(async () => ({})),
      deleteAccountAction: vi.fn(async () => ({})),
    };
    const { rerender } = render(<SettingsForm initialValues={initialValues} {...props} />);
    await user.clear(screen.getByLabelText("名前"));
    await user.type(screen.getByLabelText("名前"), "書きかけ");

    rerender(
      <SettingsForm initialValues={{ ...initialValues, name: "山田花子" }} {...props} />,
    );

    expect(screen.getByLabelText("名前")).toHaveValue("山田花子");
  });
});
