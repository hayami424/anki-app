import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals を無効にしているため、テストごとの DOM 後片付けを明示的に登録する
afterEach(() => {
  cleanup();
});
