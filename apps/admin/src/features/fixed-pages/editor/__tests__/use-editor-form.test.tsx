import { QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider } from "@tanstack/react-router";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import {
  type FixedPageEditorProps,
  useEditorForm,
} from "@/features/fixed-pages/editor/use-editor-form";
import { createI18n } from "@/i18n/create-i18n";
import { createTestApp } from "@/testing/create-test-app";
import { kind, page } from "@/testing/fixed-page-samples";
import { ToastProvider } from "@/ui/primitives/overlays";

type WrapperProps = {
  /** 描く部品。 */
  children: ReactNode;
};

const renderEditorForm = async (target: FixedPageEditorProps["page"]) => {
  const { queryClient, router } = createTestApp({
    path: "/enroll",
    routes: {},
  });
  await router.load();
  const i18n = createI18n("ja");
  const wrapper = ({ children }: WrapperProps): ReactNode => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          <ToastProvider>{children}</ToastProvider>
        </RouterContextProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return renderHook(
    () => useEditorForm({ kind, page: target, onSaved: () => undefined }),
    { wrapper },
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
