import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CategorySummary } from "@/lib/types";
import { CategoryManager, type CategoryFormState } from "./CategoryManager";

const categories: CategorySummary[] = [
  { id: "history", name: "日本史", questionCount: 3 },
  { id: "english", name: "英語", questionCount: 0 },
  { id: "math", name: "数学", questionCount: 0 },
];

function renderManager(
  props: Partial<Parameters<typeof CategoryManager>[0]> = {},
) {
  const createCategoryAction = vi.fn<
    (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>
  >(async () => ({}));
  const updateCategoryAction = vi.fn<
    (id: string, prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>
  >(async () => ({}));
  const deleteCategoriesAction = vi.fn<(ids: string[]) => Promise<{ error?: string }>>(
    async () => ({}),
  );
  render(
    <CategoryManager
      categories={categories}
      createCategoryAction={createCategoryAction}
      updateCategoryAction={updateCategoryAction}
      deleteCategoriesAction={deleteCategoriesAction}
      {...props}
    />,
  );
  return { createCategoryAction, updateCategoryAction, deleteCategoriesAction };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CategoryManager", () => {
  test("登録済みのカテゴリーを一覧表示する", () => {
    renderManager();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText("日本史")).toBeInTheDocument();
    expect(within(items[1]).getByText("英語")).toBeInTheDocument();
    expect(within(items[2]).getByText("数学")).toBeInTheDocument();
  });

  test("カテゴリーごとに登録されている問題数を表示する", () => {
    renderManager();

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("3 問")).toBeInTheDocument();
    expect(within(items[1]).getByText("0 問")).toBeInTheDocument();
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

describe("CategoryManager のカテゴリー修正", () => {
  test("「修正」を押すと現在の名前が入った入力欄を表示する", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "「英語」を修正" }));

    expect(screen.getByLabelText("「英語」の新しい名前")).toHaveValue("英語");
  });

  test("新しい名前を保存するとカテゴリーの ID と名前をアクションに送信し、入力欄を閉じる", async () => {
    const user = userEvent.setup();
    const { updateCategoryAction } = renderManager();

    await user.click(screen.getByRole("button", { name: "「英語」を修正" }));
    const input = screen.getByLabelText("「英語」の新しい名前");
    await user.clear(input);
    await user.type(input, "英単語");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(updateCategoryAction).toHaveBeenCalledTimes(1);
    expect(updateCategoryAction.mock.calls[0][0]).toBe("english");
    expect(updateCategoryAction.mock.calls[0][2].get("name")).toBe("英単語");
    expect(screen.queryByLabelText("「英語」の新しい名前")).not.toBeInTheDocument();
  });

  test("修正に失敗するとエラーを表示し、入力欄と入力値を残す", async () => {
    const user = userEvent.setup();
    renderManager({
      updateCategoryAction: vi.fn(async () => ({
        error: "同じ名前のカテゴリーが既に存在します",
        name: "日本史",
      })),
    });

    await user.click(screen.getByRole("button", { name: "「英語」を修正" }));
    const input = screen.getByLabelText("「英語」の新しい名前");
    await user.clear(input);
    await user.type(input, "日本史");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "同じ名前のカテゴリーが既に存在します",
    );
    expect(screen.getByLabelText("「英語」の新しい名前")).toHaveValue("日本史");
  });

  test("「キャンセル」を押すとアクションを呼ばずに入力欄を閉じる", async () => {
    const user = userEvent.setup();
    const { updateCategoryAction } = renderManager();

    await user.click(screen.getByRole("button", { name: "「英語」を修正" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(updateCategoryAction).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("「英語」の新しい名前")).not.toBeInTheDocument();
    expect(screen.getByText("英語")).toBeInTheDocument();
  });
});

describe("CategoryManager のカテゴリー削除", () => {
  test("何も選択していないときは削除ボタンを押せない", () => {
    renderManager();

    expect(screen.getByRole("button", { name: "選択したカテゴリーを削除" })).toBeDisabled();
  });

  test("問題が登録されているカテゴリーは選択できない", () => {
    renderManager();

    expect(screen.getByRole("checkbox", { name: "「日本史」を選択" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("選択したカテゴリーを確認のうえまとめて削除する", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteCategoriesAction } = renderManager();

    await user.click(screen.getByRole("checkbox", { name: "「英語」を選択" }));
    await user.click(screen.getByRole("checkbox", { name: "「数学」を選択" }));
    await user.click(screen.getByRole("button", { name: "選択したカテゴリーを削除" }));

    expect(confirm).toHaveBeenCalledWith("選択した 2 件のカテゴリーを削除しますか？");
    expect(deleteCategoriesAction).toHaveBeenCalledWith(["english", "math"]);
  });

  test("確認でキャンセルすると削除しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { deleteCategoriesAction } = renderManager();

    await user.click(screen.getByRole("checkbox", { name: "「英語」を選択" }));
    await user.click(screen.getByRole("button", { name: "選択したカテゴリーを削除" }));

    expect(deleteCategoriesAction).not.toHaveBeenCalled();
  });

  test("削除に失敗するとエラーを表示する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderManager({
      deleteCategoriesAction: vi.fn(async () => ({
        error: "問題が登録されているカテゴリーは削除できません",
      })),
    });

    await user.click(screen.getByRole("checkbox", { name: "「英語」を選択" }));
    await user.click(screen.getByRole("button", { name: "選択したカテゴリーを削除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "問題が登録されているカテゴリーは削除できません",
    );
  });

  test("カテゴリーが 1 件もない場合は削除ボタンを表示しない", () => {
    renderManager({ categories: [] });

    expect(
      screen.queryByRole("button", { name: "選択したカテゴリーを削除" }),
    ).not.toBeInTheDocument();
  });
});
