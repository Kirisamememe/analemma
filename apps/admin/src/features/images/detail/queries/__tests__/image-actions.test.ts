import { describe, expect, test } from "bun:test";

import { saveImage } from "../image-actions";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const MISSING_ID = "019b0000-0000-7000-8000-0000000000ff";

describe("saveImage", () => {
  test("無い画像は NotFound にする", async () => {
    const { api } = createFakeApi(createImageRoutes([]).routes);

    const result = await saveImage(api, {
      id: MISSING_ID,
      values: { title: "", description: "", alt: "" },
    });

    expect(result).toEqual({ _tag: "NotFound" });
  });
});
