import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import type { ReactNode } from "react";

import { useAppForm } from "@/components/forms";
import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";

type FormValues = {
  /** タイトル。 */
  title: string;
  /** 本文。 */
  body: string;
  /** 並べる順。 */
  order: number | null;
  /** 公開日。 */
  publishedOn: string | null;
  /** 一覧で先頭に表示するか。 */
  pinned: boolean | null;
  /** 公開サイトで使う季節。 */
  season: string | null;
};

const INITIAL_VALUES: FormValues = {
  title: "春の便り",
  body: "本文",
  order: 1,
  publishedOn: "2026-04-01",
  pinned: false,
  season: "spring",
};

const OPTIONS = [
  { value: "spring", label: "春" },
  { value: "summer", label: "夏" },
];

const acceptTitle = (_title: string): Promise<undefined> =>
  Promise.resolve(undefined);

type ExampleProps = {
  /** 送信のときに値を確かめる関数。 */
  validate: (values: FormValues) => Promise<undefined>;
  /** 検証を通った値を受け取る関数。 */
  onSubmit: (values: FormValues) => Promise<void>;
  /** 入力の途中にタイトルを確かめる関数。 */
  validateTitleOnChange?: (title: string) => Promise<string | undefined>;
};

const Example = ({
  validate,
  onSubmit,
  validateTitleOnChange = acceptTitle,
}: ExampleProps): ReactNode => {
  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: INITIAL_VALUES,
    validators: { onSubmitAsync: ({ value }) => validate(value) },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <form.AppForm>
          <form.Form>
            <form.AppField
              name="title"
              validators={{
                onChangeAsync: ({ value }) => validateTitleOnChange(value),
              }}
            >
              {(field) => <field.TextField label="タイトル" />}
            </form.AppField>
            <form.AppField name="body">
              {(field) => <field.TextArea label="本文" />}
            </form.AppField>
            <form.AppField name="order">
              {(field) => <field.NumberField label="順番" />}
            </form.AppField>
            <form.AppField name="publishedOn">
              {(field) => <field.DateField label="公開日" />}
            </form.AppField>
            <form.AppField name="pinned">
              {(field) => <field.Checkbox label="先頭に表示する" />}
            </form.AppField>
            <form.AppField name="season">
              {(field) => <field.Select label="季節" options={OPTIONS} />}
            </form.AppField>
            <Button
              pendingLabel="処理中"
              isPending={isSubmitting}
              type="submit"
            >
              保存
            </Button>
          </form.Form>
        </form.AppForm>
      )}
    </form.Subscribe>
  );
};

const titleInput = (): HTMLInputElement =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "タイトル" });

beforeEach(() => {
  const selection = window.getSelection();

  if (selection === null) {
    throw new Error("Selection を取得できませんでした。");
  }

  spyOn(selection, "collapse").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  mock.restore();
});

describe("送信の途中の入力欄", () => {
  test("送信の検証を待つ間に入力しようとしても値は変わらず、検証した値を onSubmit に渡すこと", async () => {
    const user = userEvent.setup();
    const validation = Promise.withResolvers<undefined>();
    const validate = mock((_values: FormValues) => validation.promise);
    const onSubmit = mock((_values: FormValues) => Promise.resolve());

    renderWithI18n(<Example onSubmit={onSubmit} validate={validate} />);
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => {
      expect(validate).toHaveBeenCalledTimes(1);
    });

    await user.type(titleInput(), "の追記");
    await user.type(screen.getByRole("textbox", { name: "本文" }), "の追記");
    const order = screen.getByRole("textbox", { name: "順番" });
    await user.type(order, "5");
    await user.tripleClick(order);
    await user.paste("5");
    await user.click(screen.getByRole("spinbutton", { name: /day.*公開日/iv }));
    await user.keyboard("{ArrowUp}");
    await user.click(screen.getByRole("checkbox", { name: "先頭に表示する" }));
    await user.click(screen.getByRole("button", { name: /季節/v }));
    await user.click(screen.getByRole("option", { name: "夏" }));

    validation.resolve(undefined);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(validate.mock.calls[0]?.[0]).toEqual(INITIAL_VALUES);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(INITIAL_VALUES);
  });

  test("onSubmit が終わるまで入力欄を読み取り専用にし、ボタンに送信中を出すこと", async () => {
    const user = userEvent.setup();
    const submission = Promise.withResolvers<undefined>();
    const onSubmit = mock((_values: FormValues) => submission.promise);

    renderWithI18n(
      <Example
        onSubmit={onSubmit}
        validate={() => Promise.resolve(undefined)}
      />,
    );
    await user.type(titleInput(), "{Enter}");
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(titleInput().readOnly).toBe(true);
    expect(screen.getByRole("progressbar", { name: "処理中" })).toBeDefined();
    await user.type(titleInput(), "の追記");
    expect(titleInput().value).toBe("春の便り");

    submission.resolve(undefined);
    await waitFor(() => {
      expect(titleInput().readOnly).toBe(false);
    });
    expect(screen.queryByRole("progressbar")).toBeNull();
    await user.type(titleInput(), "の追記");
    expect(titleInput().value).toBe("春の便りの追記");
  });

  test("入力で流れる非同期の検証の間は、入力を止めないこと", async () => {
    const user = userEvent.setup();
    const titleValidation = Promise.withResolvers<undefined>();

    const validateTitleOnChange = mock(
      (_title: string) => titleValidation.promise,
    );

    renderWithI18n(
      <Example
        onSubmit={() => Promise.resolve()}
        validate={() => Promise.resolve(undefined)}
        validateTitleOnChange={validateTitleOnChange}
      />,
    );
    await user.type(titleInput(), "の");
    await waitFor(() => {
      expect(validateTitleOnChange).toHaveBeenCalledWith("春の便りの");
    });

    expect(titleInput().readOnly).toBe(false);
    await user.type(titleInput(), "追記");
    expect(titleInput().value).toBe("春の便りの追記");

    titleValidation.resolve(undefined);
  });
});
