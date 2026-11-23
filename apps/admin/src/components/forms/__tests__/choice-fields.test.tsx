import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

type FormValues = {
  /** 一覧で先頭に表示するか。 */
  pinned: boolean;
  /** 公開サイトで使う季節。 */
  season: string | null;
};

const INITIAL_VALUES: FormValues = { pinned: true, season: "spring" };

const OPTIONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
];

type ExampleProps = {
  /** 送信した値を受け取る関数。 */
  onSubmit: (values: FormValues) => void;
};

const Example = ({ onSubmit }: ExampleProps): ReactNode => {
  const form = useAppForm({
    defaultValues: INITIAL_VALUES,
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField
          name="pinned"
          validators={{
            onBlur: ({ value }) =>
              value ? "表示位置を確認してください。" : undefined,
          }}
        >
          {(field) => <field.Checkbox label="先頭に表示する" />}
        </form.AppField>
        <form.AppField
          name="season"
          validators={{
            onBlur: ({ value }) =>
              value === "summer" ? "夏以外を選んでください。" : undefined,
          }}
        >
          {(field) => <field.Select label="季節" options={OPTIONS} />}
        </form.AppField>
        <button type="submit">保存</button>
      </form.Form>
    </form.AppForm>
  );
};

describe("TanStack Form の Checkbox と Select", () => {
  test("チェックを外した false と、選択を解除した null を送ること", async () => {
    const submissions: FormValues[] = [];
    const user = userEvent.setup();
    renderWithI18n(
      <Example
        onSubmit={(values) => {
          submissions.push(values);
        }}
      />,
      "ja",
    );

    const checkbox = screen.getByRole("checkbox", { name: "先頭に表示する" });
    const select = screen.getByRole("button", { name: /季節/v });
    await user.tab();
    expect(document.activeElement).toBe(checkbox);
    await user.keyboard(" ");
    await user.click(select);
    await user.click(screen.getByRole("option", { name: "選択なし" }));
    expect(select.textContent).toBe("選択なし");

    await user.keyboard("{ArrowRight}");
    expect(select.textContent).toBe("春");

    await user.click(select);
    await user.click(screen.getByRole("option", { name: "選択なし" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(submissions).toEqual([{ pinned: false, season: null }]);
    });
  });

  test("Checkbox と Select を出たとき、検証の誤りがそれぞれの入力の説明になること", async () => {
    const user = userEvent.setup();
    renderWithI18n(<Example onSubmit={() => undefined} />, "ja");

    await user.tab();
    await user.tab();
    expect(
      screen.getByRole("checkbox", {
        name: "先頭に表示する",
        description: "表示位置を確認してください。",
      }),
    ).toBeDefined();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("option", { name: "夏" }));
    await user.tab();

    expect(
      screen.getByRole("button", {
        name: /季節/v,
        description: "夏以外を選んでください。",
      }),
    ).toBeDefined();
  });
});
