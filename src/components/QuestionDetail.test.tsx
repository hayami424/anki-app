import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Question } from "@/lib/types";
import { QuestionDetail } from "./QuestionDetail";

const question: Question = {
  id: "q1",
  categoryId: "history",
  categoryName: "日本史",
  question: "江戸幕府を開いたのは？",
  answer: "徳川家康",
  url: "https://example.com/edo",
  reviewPhase: 2,
  nextReviewOn: "2026-01-08",
  createdAt: "2026-01-01T00:00:00Z",
  createdOn: "2026-01-01",
};

function renderDetail(overrides: Partial<Question> = {}) {
  const deleteQuestionAction = vi.fn(async () => ({}));
  render(
    <QuestionDetail
      question={{ ...question, ...overrides }}
      deleteQuestionAction={deleteQuestionAction}
    />,
  );
  return { deleteQuestionAction };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuestionDetail", () => {
  test("作成日・出題日・カテゴリー・復習フェーズ・問題・解答を表示する", () => {
    renderDetail();

    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByText("2026-01-08")).toBeInTheDocument();
    expect(screen.getByText("日本史")).toBeInTheDocument();
    expect(screen.getByText("フェーズ2")).toBeInTheDocument();
    expect(screen.getByText("江戸幕府を開いたのは？")).toBeInTheDocument();
    expect(screen.getByText("徳川家康")).toBeInTheDocument();
  });

  test("参考URLを別タブで開くリンクとして表示する", () => {
    renderDetail();

    const link = screen.getByRole("link", { name: "https://example.com/edo" });
    expect(link).toHaveAttribute("href", "https://example.com/edo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("参考URLがない場合は「なし」と表示する", () => {
    renderDetail({ url: null });

    expect(screen.getByText("なし")).toBeInTheDocument();
  });

  test("復習が完了した問題は出題日を「なし」と表示する", () => {
    renderDetail({ reviewPhase: 4, nextReviewOn: null, url: "https://example.com" });

    expect(screen.getByText("なし")).toBeInTheDocument();
  });

  test("「戻る」で問題一覧へ、「問題修正」で修正画面へ遷移するリンクを表示する", () => {
    renderDetail();

    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "問題修正" })).toHaveAttribute(
      "href",
      "/questions/q1/edit?from=detail",
    );
  });

  test("確認後に問題を削除する", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { deleteQuestionAction } = renderDetail();

    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(deleteQuestionAction).toHaveBeenCalledWith("q1");
  });

  test("確認ダイアログでキャンセルすると削除しない", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const { deleteQuestionAction } = renderDetail();

    await user.click(screen.getByRole("button", { name: "削除" }));

    expect(deleteQuestionAction).not.toHaveBeenCalled();
  });
});
