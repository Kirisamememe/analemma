import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactElement } from "react";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Select } from "@/ui/primitives/form-fields/choices/select";
import { DateField } from "@/ui/primitives/form-fields/date/date-field";
import { NumberField } from "@/ui/primitives/form-fields/number-field";
import { TextArea } from "@/ui/primitives/form-fields/text-area";
import { TextField } from "@/ui/primitives/form-fields/text-field";

afterEach(cleanup);

const FIELDS: readonly {
  /** 入力欄を描く部品の名前。 */
  readonly name: string;
  /** 入力が要るかを受けて、ラベルを「名前」にした入力欄を描く関数。 */
  readonly render: (isRequired: boolean) => ReactElement;
}[] = [
  {
    name: "TextField",
    render: (isRequired) => (
      <TextField isRequired={isRequired} label="名前" name="name" />
    ),
  },
  {
    name: "TextArea",
    render: (isRequired) => (
      <TextArea isRequired={isRequired} label="名前" name="name" />
    ),
  },
  {
    name: "NumberField",
    render: (isRequired) => (
      <NumberField isRequired={isRequired} label="名前" name="name" />
    ),
  },
  {
    name: "Select",
    render: (isRequired) => (
      <Select
        isRequired={isRequired}
        label="名前"
        name="name"
        options={[{ value: "a", label: "A" }]}
      />
    ),
  },
  {
    name: "DateField",
    render: (isRequired) => (
      <DateField isRequired={isRequired} label="名前" name="name" />
    ),
  },
];

describe("入力欄のラベル", () => {
  test.each(FIELDS)(
    "$name は、必須のときだけラベルに「必須」を添える",
    ({ render }) => {
      const { rerender } = renderWithI18n(render(true), "ja");

      expect(screen.getByText("必須")).toBeDefined();

      rerender(render(false));

      expect(screen.queryByText("必須")).toBeNull();
    },
  );

  test("「必須」は、入力欄の名前に含めない", () => {
    renderWithI18n(<TextField isRequired label="名前" name="name" />, "ja");

    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: "名前" }).required,
    ).toBe(true);
  });
});
