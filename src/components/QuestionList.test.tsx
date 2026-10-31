import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Category, Question } from "@/lib/types";
import { QuestionList } from "./QuestionList";

const categories: Category[] = [
  { id: "history", name: "日本史" },
  { id: "english", name: "英語" },
];

function buildQuestion(overrides: Partial<Question>): Question {
  return {
    id: "q",
    categoryId: "history",
    categoryName: "日本史",
    question: "問題",
    answer: "解答",
    url: null,
    reviewPhase: 1,
    nextReviewOn: "2026-01-02",
    createdAt: "2026-01-01T00:00:00Z",
    createdOn: "2026-01-01",
    ...overrides,
  };
}

const questions: Question[] = [
  buildQuestion({
    id: "q1",
    question: "江戸幕府を開いたのは？",
    reviewPhase: 2,
    nextReviewOn: "2026-01-08",
    createdAt: "2026-01-01T00:00:00Z",
    createdOn: "2026-01-01",
  }),
  buildQuestion({
    id: "q2",
    categoryId: "english",
    categoryName: "英語",
    question: "apple の意味は？",
    reviewPhase: 1,
    nextReviewOn: "2026-01-04",
    createdAt: "2026-01-03T00:00:00Z",
    createdOn: "2026-01-03",
  }),
  buildQuestion({
    id: "q3",
    question: "鎌倉幕府を開いたのは？",
    reviewPhase: 4,
    nextReviewOn: null,
    createdAt: "2026-01-02T00:00:00Z",
    createdOn: "2026-01-02",
  }),
];

function renderList(
  props: Partial<Parameters<typeof QuestionList>[0]> = {},
) {
  const deleteQuestionsAction = vi.fn<
    (ids: string[]) => Promise<{ error?: string }>
  >(async () => ({}));
  render(
    <QuestionList
      questions={questions}
      categories={categories}
      deleteQuestionsAction={deleteQuestionsAction}
      {...props}
    />,
  );
  return { deleteQuestionsAction };
}

function visibleQuestionTexts() {
  const rows = screen.getAllByRole("row").slice(1);
  return rows.map((row) => within(row).getAllByRole("cell")[2].textContent);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuestionList 表示", () => {
  test("各問題の作成日・問題・カテゴリー・出題日・復習フェーズを表示する", () => {
    renderList();

    const row = screen.getByRole("row", { name: /江戸幕府を開いたのは？/ });
    expect(row).toHaveTextContent("2026-01-01");
    expect(row).toHaveTextContent("日本史");
    expect(row).toHaveTextContent("2026-01-08");
    expect(row).toHaveTextContent("フェーズ2");
  });

  test("復習が完了した問題は出題日を「なし」と表示する", () => {
    renderList();

    const row = screen.getByRole("row", { name: /鎌倉幕府を開いたのは？/ });
    expect(row).toHaveTextContent("なし");
    expect(row).toHaveTextContent("フェーズ4");
  });

  test("問題が 1 件もない場合は登録を促すメッセージを表示する", () => {
    renderList({ questions: [] });

    expect(screen.getByText("問題がまだ登録されていません")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  test("各問題の詳細画面と修正画面へのリンクを表示する", () => {
    renderList();

    const row = screen.getByRole("row", { name: /江戸幕府を開いたのは？/ });
    expect(within(row).getByRole("link", { name: "詳細" })).toHaveAttribute(
      "href",
      "/questions/q1",
    );
    expect(within(row).getByRole("link", { name: "修正" })).toHaveAttribute(
      "href",
      "/questions/q1/edit",
    );
  });
});

describe("QuestionList 絞り込み", () => {
  test("カテゴリーを選ぶと、そのカテゴリーの問題だけを表示する", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("カテゴリーで絞り込み"), "英語");

    expect(visibleQuestionTexts()).toEqual(["apple の意味は？"]);
  });

  test("復習フェーズを選ぶと、そのフェーズの問題だけを表示する", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(
      screen.getByLabelText("復習フェーズで絞り込み"),
      "フェーズ4",
    );

    expect(visibleQuestionTexts()).toEqual(["鎌倉幕府を開いたのは？"]);
  });

  test("カテゴリーと復習フェーズを組み合わせて絞り込める", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("カテゴリーで絞り込み"), "日本史");
    await user.selectOptions(
      screen.getByLabelText("復習フェーズで絞り込み"),
      "フェーズ2",
    );

    expect(visibleQuestionTexts()).toEqual(["江戸幕府を開いたのは？"]);
  });

  test("条件に一致する問題がない場合はメッセージを表示する", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("カテゴリーで絞り込み"), "英語");
    await user.selectOptions(
      screen.getByLabelText("復習フェーズで絞り込み"),
      "フェーズ3",
    );

    expect(screen.getByText("条件に一致する問題がありません")).toBeInTheDocument();
  });

  test("絞り込みを「すべて」に戻すと全件を表示する", async () => {
    const user = userEvent.setup();
    renderList();
    const categorySelect = screen.getByLabelText("カテゴリーで絞り込み");

    await user.selectOptions(categorySelect, "英語");
    await user.selectOptions(categorySelect, "すべて");

    expect(visibleQuestionTexts()).toHaveLength(3);
  });
});

describe("QuestionList 並び替え", () => {
  test("初期表示では作成日の新しい順に並べる", () => {
    renderList();

    expect(visibleQuestionTexts()).toEqual([
      "apple の意味は？",
      "鎌倉幕府を開いたのは？",
      "江戸幕府を開いたのは？",
    ]);
  });

  test("作成日の古い順に並べ替えられる", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("並び替え"), "作成日（古い順）");

    expect(visibleQuestionTexts()).toEqual([
      "江戸幕府を開いたのは？",
      "鎌倉幕府を開いたのは？",
      "apple の意味は？",
    ]);
  });

  test("出題日の近い順に並べ替えると、出題日のない問題は最後になる", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("並び替え"), "出題日（近い順）");

    expect(visibleQuestionTexts()).toEqual([
      "apple の意味は？",
      "江戸幕府を開いたのは？",
      "鎌倉幕府を開いたのは？",
    ]);
  });

  test("出題日の遠い順に並べ替えても、出題日のない問題は最後になる", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("並び替え"), "出題日（遠い順）");

    expect(visibleQuestionTexts()).toEqual([
      "江戸幕府を開いたのは？",
      "apple の意味は？",
      "鎌倉幕府を開いたのは？",
    ]);
  });
});

describe("QuestionList 一括削除", () => {
  test("問題を選択していない間は削除ボタンを押せない", () => {
    renderList();

    expect(
      screen.getByRole("button", { name: "選択した問題を削除" }),
    ).toBeDisabled();
  });

  test("選択した問題を確認後に削除する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteQuestionsAction } = renderList();

    await user.click(screen.getByLabelText("「江戸幕府を開いたのは？」を選択"));
    await user.click(screen.getByLabelText("「apple の意味は？」を選択"));
    await user.click(screen.getByRole("button", { name: "選択した問題を削除" }));

    expect(window.confirm).toHaveBeenCalledWith("選択した 2 件の問題を削除しますか？");
    expect(deleteQuestionsAction).toHaveBeenCalledWith(
      expect.arrayContaining(["q1", "q2"]),
    );
    expect(deleteQuestionsAction.mock.calls[0][0]).toHaveLength(2);
  });

  test("確認ダイアログでキャンセルすると削除しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { deleteQuestionsAction } = renderList();

    await user.click(screen.getByLabelText("「江戸幕府を開いたのは？」を選択"));
    await user.click(screen.getByRole("button", { name: "選択した問題を削除" }));

    expect(deleteQuestionsAction).not.toHaveBeenCalled();
  });

  test("選択を外すと削除ボタンを再び押せなくなる", async () => {
    const user = userEvent.setup();
    renderList();
    const checkbox = screen.getByLabelText("「江戸幕府を開いたのは？」を選択");

    await user.click(checkbox);
    await user.click(checkbox);

    expect(
      screen.getByRole("button", { name: "選択した問題を削除" }),
    ).toBeDisabled();
  });

  test("絞り込みで非表示になった問題は削除対象に含めない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteQuestionsAction } = renderList();

    await user.click(screen.getByLabelText("「江戸幕府を開いたのは？」を選択"));
    await user.click(screen.getByLabelText("「apple の意味は？」を選択"));
    await user.selectOptions(screen.getByLabelText("カテゴリーで絞り込み"), "英語");
    await user.click(screen.getByRole("button", { name: "選択した問題を削除" }));

    expect(deleteQuestionsAction).toHaveBeenCalledWith(["q2"]);
  });

  test("削除に失敗した場合はエラーメッセージを表示する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderList({
      deleteQuestionsAction: vi.fn(async () => ({
        error: "問題の削除に失敗しました",
      })),
    });

    await user.click(screen.getByLabelText("「江戸幕府を開いたのは？」を選択"));
    await user.click(screen.getByRole("button", { name: "選択した問題を削除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "問題の削除に失敗しました",
    );
  });
});
