import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactElement } from "react";

import { findFieldGuidesWithPeriods } from "../../../../../../test-setup/field-guide";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Select } from "@/ui/primitives/form-fields/choices/select";
import { DateField } from "@/ui/primitives/form-fields/date/date-field";
import { NumberField } from "@/ui/primitives/form-fields/number/number-field";
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
      <TextField
        requiredLabel={isRequired ? "必須" : undefined}
        label="名前"
        name="name"
      />
    ),
  },
  {
    name: "TextArea",
    render: (isRequired) => (
      <TextArea
        requiredLabel={isRequired ? "必須" : undefined}
        label="名前"
        name="name"
      />
    ),
  },
  {
    name: "NumberField",
    render: (isRequired) => (
      <NumberField
        decrementLabel="値を減らす"
        incrementLabel="値を増やす"
        requiredLabel={isRequired ? "必須" : undefined}
        label="名前"
        name="name"
      />
    ),
  },
  {
    name: "Select",
    render: (isRequired) => (
      <Select
        noneLabel="選択なし"
        placeholder="選択してください"
        requiredLabel={isRequired ? "必須" : undefined}
        label="名前"
        name="name"
        options={[{ value: "a", label: "A" }]}
      />
    ),
  },
  {
    name: "DateField",
    render: (isRequired) => (
      <DateField
        incompleteMessage="年・月・日を入力してください。"
        requiredLabel={isRequired ? "必須" : undefined}
        label="名前"
        name="name"
      />
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
    renderWithI18n(
      <TextField requiredLabel="必須" label="名前" name="name" />,
      "ja",
    );

    expect(
      screen.getByRole<HTMLInputElement>("textbox", { name: "名前" }).required,
    ).toBe(true);
  });
});

test("ガイドの末尾だけを調べ、同じ入力欄の入力例とエラーの句点を許す", () => {
  renderWithI18n(
    <TextField
      name="title"
      label="タイトル"
      placeholder="朝霧の湖。"
      description="200文字まで。"
      errorMessage="長すぎます。"
    />,
    "ja",
  );
  expect(findFieldGuidesWithPeriods(document.body, "ja")).toEqual([
    "200文字まで。",
  ]);
});

test("英語のガイドではピリオドを許す", () => {
  renderWithI18n(
    <TextArea
      name="description"
      label="Description"
      description="Enter up to 5,000 characters."
    />,
    "en",
  );
  expect(findFieldGuidesWithPeriods(document.body, "en")).toEqual([]);
});
