"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import type { ReviewQuestion } from "@/lib/types";

export type SubmitAnswerResult =
  | { isCorrect: boolean; correctAnswer: string }
  | { error: string };

type Props = {
  questions: ReviewQuestion[];
  submitAnswerAction: (id: string, answer: string) => Promise<SubmitAnswerResult>;
};

type Judgement = { userAnswer: string; isCorrect: boolean; correctAnswer: string };

export function ReviewSession({ questions, submitAnswerAction }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [judgement, setJudgement] = useState<Judgement>();
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>今日復習する問題はありません</p>
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/">
          戻る
        </Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>今日の問題は {questions.length} 問です</p>
        <div className="flex gap-3">
          <Link className="rounded border border-zinc-300 px-4 py-2" href="/">
            戻る
          </Link>
          <button
            type="button"
            className="rounded bg-blue-600 px-4 py-2 text-white"
            onClick={() => setStarted(true)}
          >
            復習スタート
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg font-semibold">復習が完了しました</p>
        <p>
          {questions.length} 問中 {correctCount} 問正解
        </p>
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/">
          問題一覧に戻る
        </Link>
      </div>
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await submitAnswerAction(current.id, answer);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setJudgement({ userAnswer: answer, ...result });
      if (result.isCorrect) setCorrectCount((count) => count + 1);
    });
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setAnswer("");
    setJudgement(undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600">
          {index + 1} / {questions.length} 問目
        </p>
        <Link className="rounded border border-zinc-300 px-3 py-1.5 text-sm" href="/">
          復習終了
        </Link>
      </div>

      <div className="rounded border border-zinc-300 p-4">
        <p className="text-sm text-zinc-600">{current.categoryName}</p>
        <p className="mt-2 whitespace-pre-wrap text-lg">{current.question}</p>
      </div>

      {judgement ? (
        <div className="flex flex-col items-start gap-2">
          <p
            className={`text-2xl font-bold ${judgement.isCorrect ? "text-green-600" : "text-red-600"}`}
          >
            {judgement.isCorrect ? "○ 正解" : "× 不正解"}
          </p>
          <p className="whitespace-pre-wrap">あなたの解答：{judgement.userAnswer}</p>
          <p className="whitespace-pre-wrap">正解：{judgement.correctAnswer}</p>
          <button
            type="button"
            className="mt-2 rounded bg-blue-600 px-4 py-2 text-white"
            onClick={handleNext}
          >
            {isLast ? "結果を見る" : "次の問題へ"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="answer">あなたの解答</label>
          <textarea
            id="answer"
            rows={2}
            className="rounded border border-zinc-300 px-2 py-1.5"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
              disabled={answer.trim() === "" || isPending}
            >
              解答を送信
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
