import Link from "next/link";
import type { Question } from "@/lib/types";
import { DeleteQuestionButton } from "./DeleteQuestionButton";

type Props = {
  question: Question;
  deleteQuestionAction: (id: string) => Promise<{ error?: string }>;
};

export function QuestionDetail({ question, deleteQuestionAction }: Props) {
  const items = [
    { label: "作成日", value: question.createdOn },
    { label: "出題日", value: question.nextReviewOn ?? "なし" },
    { label: "カテゴリー", value: question.categoryName },
    { label: "復習フェーズ", value: `フェーズ${question.reviewPhase}` },
    { label: "問題", value: question.question },
    { label: "解答", value: question.answer },
  ];

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        {items.map((item) => (
          <div key={item.label} className="contents">
            <dt className="font-semibold text-zinc-600">{item.label}</dt>
            <dd className="whitespace-pre-wrap">{item.value}</dd>
          </div>
        ))}
        <dt className="font-semibold text-zinc-600">参考URL</dt>
        <dd className="break-all">
          {question.url ? (
            <a
              className="text-blue-600 underline"
              href={question.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {question.url}
            </a>
          ) : (
            "なし"
          )}
        </dd>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded border border-zinc-300 px-4 py-2" href="/">
          戻る
        </Link>
        <Link
          className="rounded bg-blue-600 px-4 py-2 text-white"
          href={`/questions/${question.id}/edit?from=detail`}
        >
          問題修正
        </Link>
        <DeleteQuestionButton id={question.id} deleteQuestionAction={deleteQuestionAction} />
      </div>
    </div>
  );
}
