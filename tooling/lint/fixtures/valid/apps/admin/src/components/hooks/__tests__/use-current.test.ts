import { renderHook } from "@testing-library/react";
import { expect, test } from "bun:test";

import { useCurrent } from "../use-current";

import { createI18n } from "@/i18n/create-i18n";
import { withI18n } from "@/testing/render-with-i18n";

test("選んだ言語を返すこと", () => {
  const { result } = renderHook(useCurrent, {
    wrapper: withI18n(createI18n("ja")),
  });

  expect(result.current).toBe("ja");
});
