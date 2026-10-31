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
