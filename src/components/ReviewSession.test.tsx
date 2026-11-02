import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReviewQuestion } from "@/lib/types";
import { ReviewSession, type SubmitAnswerResult } from "./ReviewSession";

const questions: ReviewQuestion[] = [
  { id: "q1", question: "江戸幕府を開いたのは？", categoryName: "日本史" },
  { id: "q2", question: "apple の意味は？", categoryName: "英語" },
];

const correctAnswers: Record<string, string> = {
  q1: "徳川家康",
  q2: "りんご",
};

function fakeSubmitAnswer() {
  return vi.fn(
    async (id: string, answer: string): Promise<SubmitAnswerResult> => ({
      isCorrect: answer === correctAnswers[id],
      correctAnswer: correctAnswers[id],
    }),
  );
}

function renderSession(
  props: Partial<Parameters<typeof ReviewSession>[0]> = {},
) {
  const submitAnswerAction = fakeSubmitAnswer();
  render(
    <ReviewSession
      questions={questions}
      submitAnswerAction={submitAnswerAction}
      {...props}
    />,
  );
  return { submitAnswerAction };
}

async function startReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "復習スタート" }));
}

async function answer(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText("あなたの解答"), text);
  await user.click(screen.getByRole("button", { name: "解答を送信" }));
}

describe("ReviewSession 出題開始", () => {
  test("開始前は今日の問題数と「復習スタート」ボタンを表示する", () => {
    renderSession();

    expect(screen.getByText("今日の問題は 2 問です")).toBeInTheDocument();
    expect(screen.queryByText("江戸幕府を開いたのは？")).not.toBeInTheDocument();
  });

  test("「復習スタート」を押すと 1 問目を表示する", async () => {
    const user = userEvent.setup();
    renderSession();

    await startReview(user);

    expect(screen.getByText("1 / 2 問目")).toBeInTheDocument();
    expect(screen.getByText("江戸幕府を開いたのは？")).toBeInTheDocument();
    expect(screen.getByText("日本史")).toBeInTheDocument();
  });

  test("今日の問題がない場合はメッセージと「戻る」リンクを表示する", () => {
    renderSession({ questions: [] });

    expect(screen.getByText("今日復習する問題はありません")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute("href", "/");
    expect(
      screen.queryByRole("button", { name: "復習スタート" }),
    ).not.toBeInTheDocument();
  });
});

describe("ReviewSession 解答と正誤判定", () => {
  test("解答が空の間は送信できない", async () => {
    const user = userEvent.setup();
    renderSession();
    await startReview(user);

    expect(screen.getByRole("button", { name: "解答を送信" })).toBeDisabled();

    await user.type(screen.getByLabelText("あなたの解答"), "   ");

    expect(screen.getByRole("button", { name: "解答を送信" })).toBeDisabled();
  });

  test("正しい解答を送信すると、解答・正解・○を表示する", async () => {
    const user = userEvent.setup();
    const { submitAnswerAction } = renderSession();
    await startReview(user);

    await answer(user, "徳川家康");

    expect(submitAnswerAction).toHaveBeenCalledWith("q1", "徳川家康");
    expect(await screen.findByText("○ 正解")).toBeInTheDocument();
    expect(screen.getByText("あなたの解答：徳川家康")).toBeInTheDocument();
    expect(screen.getByText("正解：徳川家康")).toBeInTheDocument();
  });

  test("誤った解答を送信すると、解答・正解・×を表示する", async () => {
    const user = userEvent.setup();
    renderSession();
    await startReview(user);

    await answer(user, "豊臣秀吉");

    expect(await screen.findByText("× 不正解")).toBeInTheDocument();
    expect(screen.getByText("あなたの解答：豊臣秀吉")).toBeInTheDocument();
    expect(screen.getByText("正解：徳川家康")).toBeInTheDocument();
  });

  test("送信に失敗するとエラーを表示し、もう一度送信できる", async () => {
    const user = userEvent.setup();
    const submitAnswerAction = vi
      .fn()
      .mockResolvedValueOnce({ error: "解答の送信に失敗しました" })
      .mockResolvedValueOnce({ isCorrect: true, correctAnswer: "徳川家康" });
    renderSession({ submitAnswerAction });
    await startReview(user);

    await answer(user, "徳川家康");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "解答の送信に失敗しました",
    );
    expect(screen.getByLabelText("あなたの解答")).toHaveValue("徳川家康");

    await user.click(screen.getByRole("button", { name: "解答を送信" }));

    expect(await screen.findByText("○ 正解")).toBeInTheDocument();
  });
});

describe("ReviewSession 問題の遷移", () => {
  test("「次の問題へ」を押すと次の問題を空の解答欄で表示する", async () => {
    const user = userEvent.setup();
    renderSession();
    await startReview(user);
    await answer(user, "徳川家康");

    await user.click(await screen.findByRole("button", { name: "次の問題へ" }));

    expect(screen.getByText("2 / 2 問目")).toBeInTheDocument();
    expect(screen.getByText("apple の意味は？")).toBeInTheDocument();
    expect(screen.getByLabelText("あなたの解答")).toHaveValue("");
  });

  test("最後の問題に解答すると「結果を見る」で正解数を表示する", async () => {
    const user = userEvent.setup();
    renderSession();
    await startReview(user);
    await answer(user, "徳川家康");
    await user.click(await screen.findByRole("button", { name: "次の問題へ" }));
    await answer(user, "みかん");

    await user.click(await screen.findByRole("button", { name: "結果を見る" }));

    expect(screen.getByText("復習が完了しました")).toBeInTheDocument();
    expect(screen.getByText("2 問中 1 問正解")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "問題一覧に戻る" }),
    ).toHaveAttribute("href", "/");
  });

  test("出題中は「復習終了」で問題一覧へ戻るリンクを表示する", async () => {
    const user = userEvent.setup();
    renderSession();
    await startReview(user);

    expect(screen.getByRole("link", { name: "復習終了" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});

describe("ReviewSession 出題タイプの選択", () => {
  const categories = [
    { id: "history", name: "日本史" },
    { id: "english", name: "英語" },
  ];

  test("省略時は「今日の問題」を選択した状態で、カテゴリーの選択欄は表示しない", () => {
    renderSession();

    expect(screen.getByLabelText("出題タイプ")).toHaveValue("today");
    expect(screen.queryByLabelText("カテゴリー")).not.toBeInTheDocument();
  });

  test("「カテゴリー別」を選ぶとカテゴリーの選択欄を表示する", async () => {
    const user = userEvent.setup();
    renderSession({ categories });

    await user.selectOptions(screen.getByLabelText("出題タイプ"), "category");

    const categorySelect = screen.getByLabelText("カテゴリー");
    expect(categorySelect).toHaveValue("");
    await user.selectOptions(categorySelect, "english");
    expect(categorySelect).toHaveValue("english");
  });

  test("選択欄は /review への GET フォームで送信する", () => {
    renderSession();

    const form = screen.getByRole("button", { name: "この条件で出題" }).closest("form");
    expect(form).toHaveAttribute("action", "/review");
  });

  test("「全問復習」では出題数と、出題日が変わらないことを表示する", () => {
    renderSession({ selection: { mode: "all" } });

    expect(screen.getByLabelText("出題タイプ")).toHaveValue("all");
    expect(screen.getByText("出題する問題は 2 問です")).toBeInTheDocument();
    expect(
      screen.getByText("練習なので、解答しても復習フェーズと出題日は変わりません"),
    ).toBeInTheDocument();
    expect(screen.queryByText("今日の問題は 2 問です")).not.toBeInTheDocument();
  });

  test("「カテゴリー別」では選んだカテゴリーを選択欄に表示する", () => {
    renderSession({ selection: { mode: "category", categoryId: "history" }, categories });

    expect(screen.getByLabelText("出題タイプ")).toHaveValue("category");
    expect(screen.getByLabelText("カテゴリー")).toHaveValue("history");
    expect(screen.getByText("出題する問題は 2 問です")).toBeInTheDocument();
  });

  test("問題が 0 件でも出題タイプを選び直せる", () => {
    renderSession({ questions: [] });

    expect(screen.getByLabelText("出題タイプ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "この条件で出題" })).toBeInTheDocument();
  });

  test.each([
    [{ mode: "all" } as const, "問題がまだ登録されていません"],
    [{ mode: "category", categoryId: null } as const, "カテゴリーを選んでください"],
    [{ mode: "category", categoryId: "history" } as const, "このカテゴリーには問題がありません"],
  ])("問題が 0 件のとき、出題タイプ %o に合わせたメッセージを表示する", (selection, message) => {
    renderSession({ questions: [], selection, categories });

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "復習スタート" })).not.toBeInTheDocument();
  });

  test("出題タイプを選んだ後も、解答は同じアクションで送信する", async () => {
    const user = userEvent.setup();
    const { submitAnswerAction } = renderSession({ selection: { mode: "all" } });

    await startReview(user);
    await answer(user, "徳川家康");

    expect(submitAnswerAction).toHaveBeenCalledTimes(1);
  });
});
