import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Category } from "@/lib/types";
import { QuestionForm, type QuestionFormState } from "./QuestionForm";

const categories: Category[] = [
  { id: "history", name: "日本史" },
  { id: "english", name: "英語" },
];

function renderForm(props: Partial<Parameters<typeof QuestionForm>[0]> = {}) {
  const action = vi.fn<
    (prev: QuestionFormState, formData: FormData) => Promise<QuestionFormState>
  >(async () => ({}));
  render(
    <QuestionForm
      categories={categories}
      action={action}
      submitLabel="作成"
      cancelHref="/"
      {...props}
    />,
  );
  return { action };
}

describe("QuestionForm", () => {
  test("入力した内容をアクションに送信する", async () => {
    const user = userEvent.setup();
    const { action } = renderForm();

    await user.selectOptions(screen.getByLabelText("カテゴリー"), "英語");
    await user.type(screen.getByLabelText("問題"), "apple の意味は？");
    await user.type(screen.getByLabelText("解答"), "りんご");
    await user.type(screen.getByLabelText("参考URL（任意）"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "作成" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({
      categoryId: "english",
      question: "apple の意味は？",
      answer: "りんご",
      url: "https://example.com",
    });
  });

  test("アクションが入力エラーを返すと、各項目のエラーメッセージと入力値を表示する", async () => {
    const user = userEvent.setup();
    renderForm({
      action: vi.fn(async () => ({
        errors: {
          question: "問題を入力してください",
          url: "URLは http:// または https:// で始まる形式で入力してください",
        },
        values: {
          categoryId: "english",
          question: "",
          answer: "りんご",
          url: "example.com",
        },
      })),
    });

    await user.click(screen.getByRole("button", { name: "作成" }));

    expect(await screen.findByText("問題を入力してください")).toBeInTheDocument();
    expect(
      screen.getByText("URLは http:// または https:// で始まる形式で入力してください"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("問題")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("解答")).toHaveValue("りんご");
    expect(screen.getByLabelText("参考URL（任意）")).toHaveValue("example.com");
    expect(screen.getByLabelText("カテゴリー")).toHaveValue("english");
  });

  test("アクションが保存失敗を返すと、フォーム全体のエラーを表示する", async () => {
    const user = userEvent.setup();
    renderForm({
      action: vi.fn(async () => ({ errors: { form: "問題の保存に失敗しました" } })),
    });

    await user.click(screen.getByRole("button", { name: "作成" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "問題の保存に失敗しました",
    );
  });

  test("初期値を指定すると各項目に表示する（修正時）", () => {
    renderForm({
      submitLabel: "修正",
      initialValues: {
        categoryId: "history",
        question: "江戸幕府を開いたのは？",
        answer: "徳川家康",
        url: "https://example.com/edo",
      },
    });

    expect(screen.getByLabelText("カテゴリー")).toHaveValue("history");
    expect(screen.getByLabelText("問題")).toHaveValue("江戸幕府を開いたのは？");
    expect(screen.getByLabelText("解答")).toHaveValue("徳川家康");
    expect(screen.getByLabelText("参考URL（任意）")).toHaveValue(
      "https://example.com/edo",
    );
    expect(screen.getByRole("button", { name: "修正" })).toBeInTheDocument();
  });

  test("「戻る」リンクは指定した遷移先を指す", () => {
    renderForm({ cancelHref: "/questions/q1" });

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute(
      "href",
      "/questions/q1",
    );
  });

  test("カテゴリーが 1 件もない場合は登録を促し、送信できない", () => {
    renderForm({ categories: [] });

    expect(
      screen.getByRole("link", { name: "カテゴリーを登録する" }),
    ).toHaveAttribute("href", "/categories");
    expect(screen.getByRole("button", { name: "作成" })).toBeDisabled();
  });
});
