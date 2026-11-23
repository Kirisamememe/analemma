import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { z } from "zod";

import "../zod-config";

describe("管理画面の Zod の設定", () => {
  afterEach(() => {
    mock.restore();
  });

  test("スキーマで検査するときに、new Function で検査のコードを作らないこと", () => {
    const createFunction = spyOn(globalThis, "Function");
    const schema = z.object({ name: z.string(), count: z.number() });

    expect(schema.parse({ name: "about", count: 1 })).toEqual({
      name: "about",
      count: 1,
    });
    expect(schema.safeParse({ name: "about" }).success).toBe(false);
    expect(createFunction).not.toHaveBeenCalled();
  });
});
