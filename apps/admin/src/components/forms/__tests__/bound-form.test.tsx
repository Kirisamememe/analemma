import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";

afterEach(cleanup);

type Values = {
  /** タイトル。 */
  title: string;
  /** 本文。 */
  body: string;
  /** 件数。 */
  count: number | null;
  /** 季節。 */
  season: string | null;
  /** 公開日。 */
  date: string | null;
  /** 同意したか。 */
  agreed: boolean;
};

const FILLED: Values = {
  title: "お知らせ",
  body: "本文",
  count: 1,
  season: "spring",
  date: "2026-11-23",
  agreed: true,
};

const MISSING = "入力してください";

const required = ({ value }: Record<"value", unknown>) =>
  value === "" || value === null || value === false ? MISSING : undefined;

type ExampleProps = {
  /** 最初に入れておく値。 */
  defaultValues: Values;
  /** 送った値を受け取る関数。 */
  onSubmit?: (values: Values) => undefined;
};

const Example = ({ defaultValues, onSubmit }: ExampleProps): ReactNode => {
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues,
    onSubmit: ({ value }) => {
      onSubmit?.(value);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="title" validators={{ onSubmit: required }}>
          {(field) => <field.TextField isRequired label="タイトル" />}
        </form.AppField>
        <form.AppField name="body" validators={{ onSubmit: required }}>
          {(field) => <field.TextArea isRequired label="本文" />}
        </form.AppField>
        <form.AppField name="count" validators={{ onSubmit: required }}>
          {(field) => <field.NumberField isRequired label="件数" />}
        </form.AppField>
        <form.AppField name="season" validators={{ onSubmit: required }}>
          {(field) => (
            <field.Select
              isRequired
              label="季節"
              options={[{ value: "spring", label: "春" }]}
            />
          )}
        </form.AppField>
        <form.AppField name="date" validators={{ onSubmit: required }}>
          {(field) => <field.DateField isRequired label="公開日" />}
        </form.AppField>
        <form.AppField name="agreed" validators={{ onSubmit: required }}>
          {(field) => <field.Checkbox isRequired label="同意する" />}
        </form.AppField>
        <Button type="submit">保存</Button>
      </form.Form>
    </form.AppForm>
  );
};

const CASES: readonly {
  /** テスト名に使う入力欄の名前。 */
  readonly kind: string;
  /** 空にする値。 */
  readonly empty: Partial<Values>;
  /** focus を受け取る要素を探す関数。 */
  readonly target: () => HTMLElement;
}[] = [
  {
    kind: "1行の入力欄",
    empty: { title: "" },
    target: () => screen.getByRole("textbox", { name: "タイトル" }),
  },
  {
    kind: "長いテキストの入力欄",
    empty: { body: "" },
    target: () => screen.getByRole("textbox", { name: "本文" }),
  },
  {
    kind: "数値の入力欄",
    empty: { count: null },
    target: () => screen.getByRole("textbox", { name: "件数" }),
  },
  {
    kind: "Select のボタン",
    empty: { season: null },
    target: () => screen.getByRole("button", { name: /季節/v }),
  },
  {
    kind: "Checkbox",
    empty: { agreed: false },
    target: () => screen.getByRole("checkbox", { name: "同意する" }),
  },
];

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

describe("TanStack Form につないだフォーム", () => {
  test.each(CASES)(
    "送信の検証で止まったら、誤りのある$kindへ focus を移すこと",
    async ({ empty, target }) => {
      const onSubmit = mock((_values: Values) => undefined);

      renderWithI18n(
        <Example defaultValues={{ ...FILLED, ...empty }} onSubmit={onSubmit} />,
      );
      await userEvent.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(document.activeElement).toBe(target());
      });
      expect(screen.getByText(MISSING)).toBeDefined();
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  test("誤りの欄が複数あれば、画面の上にある欄へ focus を移すこと", async () => {
    renderWithI18n(
      <Example defaultValues={{ ...FILLED, title: "", agreed: false }} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("textbox", { name: "タイトル" }),
      );
    });
  });

  test("検証を通って送ったら、focus を動かさないこと", async () => {
    const onSubmit = mock((_values: Values) => undefined);

    renderWithI18n(<Example defaultValues={FILLED} onSubmit={onSubmit} />);
    const save = screen.getByRole("button", { name: "保存" });

    await userEvent.click(save);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(FILLED);
    });
    await nextFrame();

    expect(document.activeElement).toBe(save);
  });
});
