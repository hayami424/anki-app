import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Category } from "@/lib/types";
import { CategoryManager, type CategoryFormState } from "./CategoryManager";

const categories: Category[] = [
  { id: "history", name: "日本史" },
  { id: "english", name: "英語" },
];

function renderManager(
  props: Partial<Parameters<typeof CategoryManager>[0]> = {},
) {
  const createCategoryAction = vi.fn<
    (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>
  >(async () => ({}));
  render(
    <CategoryManager
      categories={categories}
      createCategoryAction={createCategoryAction}
      {...props}
    />,
  );
  return { createCategoryAction };
}

describe("CategoryManager", () => {
  test("登録済みのカテゴリーを一覧表示する", () => {
    renderManager();

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["日本史", "英語"]);
  });

  test("カテゴリーが 1 件もない場合はメッセージを表示する", () => {
    renderManager({ categories: [] });

    expect(
      screen.getByText("カテゴリーがまだ登録されていません"),
    ).toBeInTheDocument();
  });

  test("入力したカテゴリー名をアクションに送信する", async () => {
    const user = userEvent.setup();
    const { createCategoryAction } = renderManager();

    await user.type(screen.getByLabelText("カテゴリー名"), "数学");
    await user.click(screen.getByRole("button", { name: "登録" }));

    expect(createCategoryAction).toHaveBeenCalledTimes(1);
    expect(createCategoryAction.mock.calls[0][1].get("name")).toBe("数学");
  });

  test("アクションがエラーを返すとエラーメッセージと入力値を表示する", async () => {
    const user = userEvent.setup();
    renderManager({
      createCategoryAction: vi.fn(async () => ({
        error: "同じ名前のカテゴリーが既に存在します",
        name: "日本史",
      })),
    });

    await user.type(screen.getByLabelText("カテゴリー名"), "日本史");
    await user.click(screen.getByRole("button", { name: "登録" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "同じ名前のカテゴリーが既に存在します",
    );
    expect(screen.getByLabelText("カテゴリー名")).toHaveValue("日本史");
  });

  test("「戻る」で問題一覧へ遷移するリンクを表示する", () => {
    renderManager();

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/");
  });
});
