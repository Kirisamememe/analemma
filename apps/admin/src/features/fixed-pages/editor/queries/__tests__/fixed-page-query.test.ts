import { describe, expect, test } from "bun:test";

import { loadFixedPage } from "../fixed-page-query";

import { createFakeApi } from "@/testing/create-fake-api";
import { page } from "@/testing/fixed-page-samples";

describe("loadFixedPage", () => {
  test("固定ページを読み、無ければ NOT_FOUND の結果を返す", async () => {
    const found = createFakeApi({
      "admin/fixedPages/get": () => ({ output: page }),
    });

    const missing = createFakeApi({
      "admin/fixedPages/get": () => ({ error: "NOT_FOUND" }),
    });

    expect(await loadFixedPage(found.api, page.id)).toEqual({
      _tag: "Succeeded",
      data: page,
    });
    expect(await loadFixedPage(missing.api, page.id)).toMatchObject({
      _tag: "Failed",
      code: "NOT_FOUND",
    });
  });
});
