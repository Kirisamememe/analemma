import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { CheckboxControl } from "../checkbox-control";
import { CheckboxRoot } from "../checkbox-root";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("ラベルを渡したときだけ文言を出し、必須のラベルには「必須」を添える", () => {
  const { rerender } = renderWithI18n(
    <CheckboxRoot aria-label="公開する">
      <CheckboxControl isRequired />
    </CheckboxRoot>,
    "ja",
  );

  expect(screen.queryByText("公開する")).toBeNull();
  expect(screen.queryByText("必須")).toBeNull();

  rerender(
    <CheckboxRoot>
      <CheckboxControl label="公開する" />
    </CheckboxRoot>,
  );

  expect(screen.getByText("公開する")).toBeDefined();
  expect(screen.queryByText("必須")).toBeNull();

  rerender(
    <CheckboxRoot isRequired>
      <CheckboxControl isRequired label="公開する" />
    </CheckboxRoot>,
  );

  expect(screen.getByText("必須")).toBeDefined();
});
