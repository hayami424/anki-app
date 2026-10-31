import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

test("トップページに見出しが表示される", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "To get started, edit the page.tsx file.",
  );
});
