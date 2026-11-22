import { describe, expect, test } from "bun:test";

import { copyText } from "@/features/deploy-tokens/copy-text";

describe("copyText", () => {
  test("クリップボードに書けたら Copied を返す", async () => {
    const written: string[] = [];

    expect(
      await copyText((text) => {
        written.push(text);

        return Promise.resolve();
      }, "id.secret"),
    ).toEqual({ _tag: "Copied" });
    expect(written).toEqual(["id.secret"]);
  });

  test("書けなければ(許可が無いなど)Failed を返す", async () => {
    expect(
      await copyText(
        () => Promise.reject(new DOMException("denied", "NotAllowedError")),
        "id.secret",
      ),
    ).toEqual({ _tag: "Failed" });
  });

  test("書く関数がその場で throw しても Failed を返す", async () => {
    expect(
      await copyText(() => {
        throw new TypeError("clipboard が無い");
      }, "id.secret"),
    ).toEqual({ _tag: "Failed" });
  });
});
