import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

// Supabase への問い合わせ（外部依存）は解決しない Promise にして、読み込み中の状態を表示させる
vi.mock("@/lib/data/questions", () => ({
  getQuestions: () => new Promise(() => {}),
  getCategories: () => new Promise(() => {}),
}));

test("トップページに見出しが表示される", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "問題一覧",
  );
});

test("トップページから問題作成・復習・カテゴリー画面へ遷移するリンクを表示する", () => {
  render(<Home />);

  expect(screen.getByRole("link", { name: "問題作成" })).toHaveAttribute(
    "href",
    "/questions/new",
  );
  expect(screen.getByRole("link", { name: "復習" })).toHaveAttribute(
    "href",
    "/review",
  );
  expect(screen.getByRole("link", { name: "カテゴリー" })).toHaveAttribute(
    "href",
    "/categories",
  );
});
