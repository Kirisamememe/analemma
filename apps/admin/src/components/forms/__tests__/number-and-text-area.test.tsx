import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { Form } from "@/ui/primitives/form";

afterEach(cleanup);

type FormValues = {
  /** 並べる順。 */
  order: number | null;
  /** 本文。 */
  body: string;
};

type ExampleProps = {
  /** 最初の値。 */
  initial: FormValues;
  /** 送信した値を受け取る関数。 */
  onSubmit: (values: FormValues) => void;
};

const TOO_LONG = "本文が長すぎます。";

const Example = ({ initial, onSubmit }: ExampleProps): ReactNode => {
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: initial,
    validators: {
      onSubmitAsync: ({ value }) =>
        Promise.resolve(
          value.body.length > 10 ? { fields: { body: TOO_LONG } } : undefined,
        ),
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Form
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      <form.AppField name="order">
        {(field) => <field.NumberField label="順番" />}
      </form.AppField>
      <form.AppField name="body">
        {(field) => <field.TextArea label="本文" />}
      </form.AppField>
      <button type="submit">保存</button>
    </Form>
  );
};

describe("TanStack Form の NumberField と TextArea", () => {
  test("数値を消すと null を送り、入力した数値と改行を含む本文を送ること", async () => {
    const submissions: FormValues[] = [];
    const user = userEvent.setup();
    renderWithI18n(
      <Example
        initial={{ order: 3, body: "" }}
        onSubmit={(values) => {
          submissions.push(values);
        }}
      />,
      "ja",
    );

    const order = screen.getByRole<HTMLInputElement>("textbox", {
      name: "順番",
    });
    expect(order.value).toBe("3");
    await user.clear(order);
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(submissions).toEqual([{ order: null, body: "" }]);
    });

    await user.type(order, "1.5");
    await user.type(
      screen.getByRole("textbox", { name: "本文" }),
      "春{Enter}夏",
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(submissions.at(-1)).toEqual({ order: 1.5, body: "春\n夏" });
    });
  });

  test("送信で受け取った誤りを、本文の入力欄の説明として出すこと", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <Example
        initial={{ order: null, body: "" }}
        onSubmit={() => undefined}
      />,
      "ja",
    );

    await user.type(
      screen.getByRole("textbox", { name: "本文" }),
      "とても長い本文を書いてみる",
    );
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(
      await screen.findByRole("textbox", {
        name: "本文",
        description: TOO_LONG,
      }),
    ).toBeDefined();
  });
});
