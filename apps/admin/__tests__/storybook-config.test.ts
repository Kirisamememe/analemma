import { describe, expect, test } from "bun:test";

import { adaptViteConfig } from "../.storybook/adapt-vite-config";
import { BOOT_SCRIPT_PLUGIN, BROWSER_TARGET } from "../vite.config";

describe("Storybook の Vite の設定", () => {
  test("ビルドの対象を管理画面と同じにし、head に script を書き込む plugin だけを外す", async () => {
    const adapted = await adaptViteConfig({
      plugins: [{ name: BOOT_SCRIPT_PLUGIN }, { name: "keep" }],
      build: { target: "es2020", cssTarget: "chrome100" },
    });

    expect(
      adapted.plugins?.flatMap((plugin) =>
        typeof plugin === "object" && plugin !== null && "name" in plugin
          ? [plugin.name]
          : [],
      ),
    ).toEqual(["keep"]);
    expect(adapted.build).toEqual({
      target: BROWSER_TARGET,
      cssTarget: BROWSER_TARGET,
    });
  });
});
