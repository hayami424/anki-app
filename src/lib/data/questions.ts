import { toTokyoDate } from "@/lib/review/schedule";
import { createClient } from "@/lib/supabase/server";
import type { Category, Question, ReviewPhase } from "@/lib/types";

const questionColumns =
  "id, category_id, question, answer, url, review_phase, next_review_on, created_at, categories(name)";

// PostgreSQL の型変換エラー（不正な UUID 文字列など）
const invalidTextRepresentation = "22P02";

type QuestionRow = {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  url: string | null;
  review_phase: number;
  next_review_on: string | null;
  created_at: string;
  categories: { name: string } | null;
};

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? "",
    question: row.question,
    answer: row.answer,
    url: row.url,
    reviewPhase: row.review_phase as ReviewPhase,
    nextReviewOn: row.next_review_on,
    createdAt: row.created_at,
    createdOn: toTokyoDate(new Date(row.created_at)),
  };
}

export async function getQuestions(): Promise<Question[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(questionColumns)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`問題の取得に失敗しました: ${error.message}`);
  return data.map(toQuestion);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(questionColumns)
    .eq("id", id)
    .maybeSingle();
  // UUID として不正な ID（URL の打ち間違いなど）は「存在しない問題」として扱う
  if (error?.code === invalidTextRepresentation) return null;
  if (error) throw new Error(`問題の取得に失敗しました: ${error.message}`);
  return data ? toQuestion(data) : null;
}

export async function getDueQuestions(today: string): Promise<Question[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(questionColumns)
    .lte("next_review_on", today);
  if (error) throw new Error(`問題の取得に失敗しました: ${error.message}`);
  return data.map(toQuestion);
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`カテゴリーの取得に失敗しました: ${error.message}`);
  return data;
}
