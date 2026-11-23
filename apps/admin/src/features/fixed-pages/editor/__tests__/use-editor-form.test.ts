import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import {
  type FixedPageEditorProps,
  useEditorForm,
} from "@/features/fixed-pages/editor/use-editor-form";
import { createTestApp } from "@/testing/create-test-app";
import { kind, page } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

const renderEditorForm = async (target: FixedPageEditorProps["page"]) => {
  const app = createTestApp({
    path: "/enroll",
    routes: {},
  });
  await app.router.load();

  return renderHook(
    () => useEditorForm({ kind, page: target, onSaved: () => undefined }),
    { wrapper: withAppProviders(app) },
  ).result;
};

afterEach(cleanup);

describe("useEditorForm", () => {
  test("編集するページの slug とタイトルを、入力の初期値にする", async () => {
    const result = await renderEditorForm(page);

    expect(result.current.form.state.values).toMatchObject({
      slug: page.slug,
      title: page.title,
    });
  });

  test("新しいページでは、slug とタイトルを空にする", async () => {
    const result = await renderEditorForm(undefined);

    expect(result.current.form.state.values).toMatchObject({
      slug: "",
      title: "",
    });
  });

  test("slug の形に合わない値には、訳した誤りの文を返す", async () => {
    const result = await renderEditorForm(page);
    const checkSlug = result.current.check("slug");

    expect(checkSlug({ value: "Not a slug" })).toBe(
      "slug の文字と長さを確認してください。",
    );
    expect(checkSlug({ value: "about" })).toBeUndefined();
  });
});
