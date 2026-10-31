"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  PartyPopper,
  Play,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <Sparkles className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">今日復習する問題はありません</p>
            <p className="text-sm text-muted-foreground">
              また明日、出題日を迎えた問題に挑戦しましょう
            </p>
          </div>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
            <ArrowLeft />
            戻る
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Play className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">今日の問題は {questions.length} 問です</p>
            <p className="text-sm text-muted-foreground">準備ができたらスタートしましょう</p>
          </div>
          <div className="flex gap-2">
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/">
              <ArrowLeft />
              戻る
            </Link>
            <Button type="button" size="lg" onClick={() => setStarted(true)}>
              <Play />
              復習スタート
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">復習が完了しました</p>
            <p className="text-muted-foreground">
              {questions.length} 問中 {correctCount} 問正解
            </p>
          </div>
          <p className="text-4xl font-bold tracking-tight text-primary tabular-nums">
            {Math.round((correctCount / questions.length) * 100)}%
          </p>
          <Link className={cn(buttonVariants({ size: "lg" }))} href="/">
            問題一覧に戻る
          </Link>
        </CardContent>
      </Card>
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
      <div className="flex items-center gap-4">
        <Progress
          className="flex-1"
          value={((index + (judgement ? 1 : 0)) / questions.length) * 100}
          aria-label="復習の進み具合"
        >
          <p className="text-sm font-medium tabular-nums">
            {index + 1} / {questions.length} 問目
          </p>
        </Progress>
        <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} href="/">
          <X />
          復習終了
        </Link>
      </div>

      <Card>
        <CardHeader>
          <Badge variant="outline">{current.categoryName}</Badge>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-xl leading-relaxed font-semibold whitespace-pre-wrap">
            {current.question}
          </p>
        </CardContent>

        {judgement ? (
          <CardFooter className="flex-col items-stretch gap-4">
            <div
              className={cn(
                "flex items-center gap-2 text-2xl font-bold",
                judgement.isCorrect ? "text-success" : "text-destructive",
              )}
            >
              {judgement.isCorrect ? (
                <CircleCheck className="size-7" />
              ) : (
                <CircleX className="size-7" />
              )}
              <p>{judgement.isCorrect ? "○ 正解" : "× 不正解"}</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-4 text-sm">
              <p className="whitespace-pre-wrap">あなたの解答：{judgement.userAnswer}</p>
              <p className="font-semibold whitespace-pre-wrap">正解：{judgement.correctAnswer}</p>
            </div>
            <Button type="button" size="lg" className="self-end" onClick={handleNext}>
              {isLast ? "結果を見る" : "次の問題へ"}
              <ArrowRight />
            </Button>
          </CardFooter>
        ) : (
          <CardFooter>
            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
              <Field>
                <FieldLabel htmlFor="answer">あなたの解答</FieldLabel>
                <Textarea
                  id="answer"
                  rows={2}
                  className="bg-background"
                  placeholder="解答を入力してください"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </Field>
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                size="lg"
                className="self-end"
                disabled={answer.trim() === "" || isPending}
              >
                <Send />
                解答を送信
              </Button>
            </form>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
