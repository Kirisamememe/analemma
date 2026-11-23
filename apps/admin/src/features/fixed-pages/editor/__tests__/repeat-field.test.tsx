import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

import { fieldDefinitions } from "@analemma/contract";

import { useEditorForm } from "../hooks/use-editor-form";
import { RepeatField } from "../repeat-field";

import { createTestApp } from "@/testing/create-test-app";
import { kind, page } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const [definition] = fieldDefinitions.parse([
  {
    type: "repeat",
    key: "items",
    label: "項目",
    fields: [{ type: "text", key: "text", label: "本文" }],
  },
]);

if (definition?.type !== "repeat") throw new Error("repeat の定義が要ります");

const renders: string[] = [];

const onRender: ProfilerOnRenderCallback = (id) => {
  renders.push(id);
};

const probe = (path: string): ReactNode => (
  <Profiler id={path} onRender={onRender}>
    <span>{path}</span>
  </Profiler>
);

const Repeat = (): ReactNode => {
  const { form, errors, changed } = useEditorForm({
    kind: { ...kind, fields: [definition] },
    page: {
      ...page,
      content: { items: [{ text: "1" }, { text: "2" }, { text: "3" }] },
    },
    onSaved: () => undefined,
    onDeleted: () => undefined,
  });

  return (
    <RepeatField
      form={form}
      path="items"
      definition={definition}
      changed={changed}
      errors={errors}
    >
      {probe}
    </RepeatField>
  );
};

const setUp = async () => {
  const app = createTestApp({ path: "/enroll", routes: {} });
  await app.router.load();
  const Providers = withAppProviders(app);

  render(
    <Providers>
      <Repeat />
    </Providers>,
  );

  const items = [...new Set(renders)];
  renders.length = 0;

  return {
    items,
    count: (item: string | undefined) =>
      renders.filter((id) => id === item).length,
  };
};

beforeEach(() => {
  renders.length = 0;
});

test("要素を足しても、前からある要素は、最後だったもののほかは描き直さない", async () => {
  const { items, count } = await setUp();
  const [first, second, third] = items;

  act(() => {
    screen.getByRole("button", { name: "項目を追加" }).click();
  });

  expect([count(first), count(second), count(third)]).toEqual([0, 0, 1]); // 3つ目は、下へ動かせるようになる
  expect(new Set(renders).size).toBe(2);
});

test("要素を下へ動かすと、入れ替わった2つだけを描き直す", async () => {
  const { items, count } = await setUp();
  const [first, second, third] = items;

  act(() => {
    screen.getByRole("button", { name: "項目 1 を下へ" }).click();
  });

  expect(count(first)).toBe(1);
  expect(count(second)).toBe(1);
  expect(count(third)).toBe(0);
});
