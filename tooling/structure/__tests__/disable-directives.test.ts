import { expect, test } from "bun:test";

import { isDisableDirective } from "../disable-directives";

test.each([
  " oxlint-disable project/max-code-lines -- 理由",
  " oxlint-disable-next-line typescript/no-explicit-any",
  " oxlint-disable-line",
  " eslint-disable-next-line no-console -- 理由",
])("lint を抑制するコメント(%s)を見分けること", (value) => {
  expect(isDisableDirective(value)).toBe(true);
});

test.each([
  " oxlint-enable",
  " oxlint-disabled は語の一部",
  " 抑制のコメント oxlint-disable を説明する文",
  " 値",
])("抑制ではないコメント(%s)は数えないこと", (value) => {
  expect(isDisableDirective(value)).toBe(false);
});
