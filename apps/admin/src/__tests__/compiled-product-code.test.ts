import { expect, test } from "bun:test";

import { useImage } from "@/components/images/hooks/use-image";
import { PasskeysSection } from "@/features/passkeys/passkeys-section";
import { renderApp } from "@/testing/render-app";

const usesCompilerCache = (code: unknown): boolean =>
  /\b_c\(\d+\)/v.test(String(code)); // コンパイラが関数の先頭に足す、キャッシュの確保

test("テストが読み込む製品の部品と hook は、React Compiler が変換した後のコード", () => {
  expect(usesCompilerCache(PasskeysSection)).toBe(true);
  expect(usesCompilerCache(useImage)).toBe(true);
});

test("テストの部品は、React Compiler で変換しない", () => {
  expect(usesCompilerCache(renderApp)).toBe(false);
});
