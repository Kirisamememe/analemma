import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { AtRule, Rule, parse, type ChildNode } from "postcss";

const ADMIN_ROOT = fileURLToPath(new URL("..", import.meta.url));
const THEME = "src/ui/theme.css";

const OUTLINE_UTILITIES = new Set([
  "focus-ring",
  "focus-ring-inset",
  "focus-ring-current",
]);

const SEPARATOR_COLOR = "color-mix(in oklab, var(--color-fg) 18%, transparent)";

const EDGE_UTILITIES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  "edge-outer": {
    outline: "1px solid color-mix(in oklab, var(--color-fg) 10%, transparent)",
  },
  "separator-t": {
    border: `0 solid ${SEPARATOR_COLOR}`,
    "border-block-start-width": "1px",
  },
  "separator-b": {
    border: `0 solid ${SEPARATOR_COLOR}`,
    "border-block-end-width": "1px",
  },
  "separator-s": {
    border: `0 solid ${SEPARATOR_COLOR}`,
    "border-inline-start-width": "1px",
  },
  "separator-e": {
    border: `0 solid ${SEPARATOR_COLOR}`,
    "border-inline-end-width": "1px",
  },
};

const utilityOf = (node: ChildNode): string | undefined => {
  const parent = node.parent;

  if (!(parent instanceof AtRule)) return undefined;

  return parent.name === "utility" ? parent.params : utilityOf(parent);
};

const violations = (source: string, file: string): string[] => {
  const invalid: string[] = [];
  const root = parse(source);

  root.walkDecls(/^(?:border|outline)(?:-|$)/iv, (decl) => {
    if (/(?:-radius|-collapse|-spacing)$/iv.test(decl.prop)) return;

    if (file === THEME) {
      const owner = utilityOf(decl);

      if (
        decl.prop.startsWith("outline") &&
        owner !== undefined &&
        OUTLINE_UTILITIES.has(owner)
      ) {
        return;
      }

      const rule = decl.parent;

      if (
        owner !== undefined &&
        rule instanceof AtRule &&
        rule.name === "utility" &&
        EDGE_UTILITIES[owner]?.[decl.prop] === decl.value
      ) {
        return;
      }

      if (owner === "drop-target" && rule instanceof AtRule) {
        if (
          rule.name === "utility" &&
          ((decl.prop === "outline" &&
            decl.value === "4px solid var(--color-info)") ||
            (decl.prop === "outline-offset" && decl.value === "-4px"))
        ) {
          return;
        }

        if (
          rule.name === "media" &&
          rule.params === "(forced-colors: active)" &&
          decl.prop === "outline-color" &&
          decl.value === "Highlight"
        ) {
          return;
        }
      }

      if (
        decl.prop === "border-color" &&
        decl.value === "var(--color-line)" &&
        rule instanceof Rule &&
        rule.selectors.join(",") === "*,::before,::after" &&
        rule.parent instanceof AtRule &&
        rule.parent.name === "layer" &&
        rule.parent.params === "base"
      ) {
        return;
      }
    }

    invalid.push(`${file}:${decl.source?.start?.line} ${decl.prop}`);
  });
  root.walkAtRules("apply", (rule) => {
    for (const token of rule.params.split(/\s+/v)) {
      if (
        /(?:^|:)!?(?:border(?!-spacing|-separate|-collapse)|divide|drop-target|-?outline(?!-hidden))(?:-|!|$)/v.test(
          token,
        )
      ) {
        invalid.push(`${file}:${rule.source?.start?.line} @apply ${token}`);
      }
    }
  });

  return invalid;
};

test("管理画面の CSS で枠を個別に描かず、共通の色と用途に限る", async () => {
  const invalid: string[] = [];

  for await (const file of new Bun.Glob("src/**/*.css").scan({
    cwd: ADMIN_ROOT,
  })) {
    invalid.push(
      ...violations(await readFile(`${ADMIN_ROOT}/${file}`, "utf8"), file),
    );
  }

  expect(invalid).toEqual([]);
});

test("新しい utility や @apply に書いた装飾の線も検出する", () => {
  expect(
    violations(
      "@utility card { border-inline-start: thin solid black; border-radius: 1rem; @apply md:divide-y; }",
      THEME,
    ),
  ).toEqual([
    `${THEME}:1 border-inline-start`,
    `${THEME}:1 @apply md:divide-y`,
  ]);
});

test("ドロップ先に装飾の border や別の輪郭を足すと検出する", () => {
  expect(
    violations(
      "@utility drop-target { border: 1px solid; outline-color: Highlight; }",
      THEME,
    ),
  ).toEqual([`${THEME}:1 border`, `${THEME}:1 outline-color`]);
});

test("区切りや縁の utility に、決めた色と幅のほかの線を足すと検出する", () => {
  expect(
    violations(
      "@utility separator-b { border: 0 solid var(--color-line); border-block-end-width: 1px; outline: 1px solid; }",
      THEME,
    ),
  ).toEqual([`${THEME}:1 border`, `${THEME}:1 outline`]);
});
