import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { focusFirstInvalidField } from "@/ui/primitives/form-fields/focus-first-invalid-field";
import { NumberField } from "@/ui/primitives/form-fields/number/number-field";
import { TextField } from "@/ui/primitives/form-fields/text-field";

afterEach(cleanup);

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

describe("focusFirstInvalidField", () => {
  test("誤りの無い欄を飛ばし、最初の誤りの欄の、打ち込める要素に focus を移す", async () => {
    const { container } = renderWithI18n(
      <>
        <TextField label="タイトル" name="title" />
        <NumberField
          decrementLabel="気温の値を減らす"
          incrementLabel="気温の値を増やす"
          errorMessage="件数を入力してください"
          label="件数"
          name="count"
        />
        <TextField errorMessage="入力してください" label="メモ" name="memo" />
      </>,
    );

    await act(async () => {
      focusFirstInvalidField(container);
      await nextFrame();
    });

    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "件数" }),
    );
  });

  test("誤りの欄が無ければ、focus を動かさない", async () => {
    const { container } = renderWithI18n(
      <TextField label="タイトル" name="title" />,
    );

    const before = document.activeElement;

    await act(async () => {
      focusFirstInvalidField(container);
      await nextFrame();
    });

    expect(document.activeElement).toBe(before);
  });
});
