import { QueryClient } from "@tanstack/react-query";
import { expect, test } from "bun:test";

test("作った query client に取得の結果が無いこと", () => {
  expect(new QueryClient().getQueryData(["passkeys"])).toBeUndefined();
});
