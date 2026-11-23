import { describe, expect, test } from "bun:test";

import { checkPasskeyName } from "@/components/logic/check-passkey-name";

describe("checkPasskeyName", () => {
  test.each(["MacBook", " iPhone ", "あ".repeat(64)])(
    "server が受け付ける名前 %p は通す",
    (name) => {
      expect(checkPasskeyName(name)).toBeUndefined();
    },
  );

  test.each(["", "   ", "a".repeat(65), "改行\nあり", "タブ\tあり"])(
    "server が断る名前 %p には、知らせの訳のキーを返す",
    (name) => {
      expect(checkPasskeyName(name)).toBe("passkeyName.invalid");
    },
  );
});
