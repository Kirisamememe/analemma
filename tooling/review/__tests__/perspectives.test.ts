import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PERSPECTIVES } from "../perspectives";

const PROMPTS = join(import.meta.dirname, "../prompts");

describe("観点とモデルの割り当て", () => {
  test("観点ごとに、決めたモデルで流すこと", () => {
    expect(PERSPECTIVES.map(({ id, reviewer }) => ({ id, reviewer }))).toEqual([
      {
        id: "logic",
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
      },
      {
        id: "security",
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
      },
      {
        id: "ui",
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
      },
      {
        id: "conventions",
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
      },
      {
        id: "wording",
        reviewer: { runner: "codex", model: "gpt-6.1-terra", effort: "high" },
      },
      {
        id: "coherence",
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
      },
    ]);
  });

  test("子のブランチの観点は3回まで、つながりと一貫性は2回までレビューできること", () => {
    expect(
      Object.fromEntries(
        PERSPECTIVES.map(({ id, maxRounds }) => [id, maxRounds]),
      ),
    ).toEqual({
      logic: 3,
      security: 3,
      ui: 3,
      conventions: 3,
      wording: 3,
      coherence: 2,
    });
  });

  test.each(PERSPECTIVES.map(({ id }) => id))(
    "観点 %s の prompt に、見る範囲と見ない範囲があること",
    (id) => {
      const scope = readFileSync(join(PROMPTS, `${id}.md`), "utf8");

      expect(scope).toContain("## 見る範囲");
      expect(scope).toContain("## 見ない範囲");
    },
  );

  test("どの観点にも共通の prompt に、重要度の付け方と出力の形があること", () => {
    const rules = readFileSync(join(PROMPTS, "common.md"), "utf8");

    expect(rules).toContain("## 重要度");
    expect(rules).toContain("## 出力の形");
    expect(rules).toContain("`VERDICT: LGTM`");
    expect(rules).toContain("`VERDICT: CHANGES_REQUESTED`");
  });
});
