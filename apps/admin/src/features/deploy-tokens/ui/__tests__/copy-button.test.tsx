import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { CopyButton } from "@/features/deploy-tokens/ui/copy-button";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const announced = (): string[] =>
  screen.getAllByRole("status").map(({ textContent }) => textContent);

describe("CopyButton", () => {
  test("押す前は「コピー」とだけ出し、何も読み上げない", () => {
    renderWithI18n(
      <CopyButton onPress={() => undefined} result={undefined} />,
      "ja",
    );

    expect(screen.getByRole("button", { name: "コピー" })).toBeDefined();
    expect(announced()).toEqual([""]);
  });

  test("コピーできたら、ボタンの文言を替え、コピーしたことを読み上げる", () => {
    renderWithI18n(
      <CopyButton onPress={() => undefined} result="Copied" />,
      "ja",
    );

    expect(
      screen.getByRole("button", { name: "コピーしました" }),
    ).toBeDefined();
    expect(announced()).toEqual(["トークンをクリップボードにコピーしました。"]);
  });

  test("コピーできなければ、ボタンの文言を替え、手でコピーするよう読み上げる", () => {
    renderWithI18n(
      <CopyButton onPress={() => undefined} result="Failed" />,
      "ja",
    );

    expect(
      screen.getByRole("button", { name: "コピーできませんでした" }),
    ).toBeDefined();
    expect(announced()).toEqual([
      "コピーできませんでした。トークンを選んで、手でコピーしてください。",
    ]);
  });
});
