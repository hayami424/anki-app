import { ArrowLeft, CalendarClock, CalendarPlus, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PhaseBadge } from "@/components/PhaseBadge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Question } from "@/lib/types";
import { DeleteQuestionButton } from "./DeleteQuestionButton";

type Props = {
  question: Question;
  deleteQuestionAction: (id: string) => Promise<{ error?: string }>;
};

function MetaItem({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

export function QuestionDetail({ question, deleteQuestionAction }: Props) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{question.categoryName}</Badge>
        <PhaseBadge phase={question.reviewPhase} />
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-4 pb-6">
        <dl className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground">問題</dt>
            <dd className="text-lg leading-relaxed font-semibold whitespace-pre-wrap">
              {question.question}
            </dd>
          </div>
          <div className="flex flex-col gap-2 rounded-lg bg-accent p-4">
            <dt className="text-xs font-medium tracking-wide text-accent-foreground/80">解答</dt>
            <dd className="leading-relaxed whitespace-pre-wrap text-accent-foreground">
              {question.answer}
            </dd>
          </div>
        </dl>

        <Separator />

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetaItem label="作成日" icon={<CalendarPlus />}>
            {question.createdOn}
          </MetaItem>
          <MetaItem label="出題日" icon={<CalendarClock />}>
            {question.nextReviewOn ?? "なし"}
          </MetaItem>
          <div className="col-span-2 flex min-w-0 flex-col gap-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
              <ExternalLink />
              参考URL
            </dt>
            <dd className="text-sm font-medium break-all">
              {question.url ? (
                <a
                  className="text-primary underline-offset-4 hover:underline"
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
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          <ArrowLeft />
          戻る
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DeleteQuestionButton id={question.id} deleteQuestionAction={deleteQuestionAction} />
          <Link className={cn(buttonVariants())} href={`/questions/${question.id}/edit?from=detail`}>
            <Pencil />
            問題修正
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
