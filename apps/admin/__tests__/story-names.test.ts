import { describe, expect, test } from "bun:test";

import { checkStoryCatalog } from "../.storybook/check-story-catalog";
import { withCheckedStoryIndex } from "../.storybook/check-story-index";
import { checkStoryNames } from "../.storybook/story-names";

const file = (
  title: string,
  path = "features/fixed-pages/page.stories.ts",
) => ({
  file: path,
  title,
  stories: [{ exportName: "Default" }],
});

describe("Storybook のサイドバーの名前", () => {
  test("実際に起動とビルドの対象になる全 story の名前が規則に合う", async () => {
    await checkStoryCatalog();
  });

  test.each(["FixedPages", "fixedPages", "fixed_pages", "Fixed Pages"])(
    "同じ親に fixed-pages と %s があれば両方のファイルを知らせる",
    (alias) => {
      const one = file("features/fixed-pages/ContentGroup");

      const two = file(
        `features/${alias}/KindRefreshNotice`,
        "features/fixed-pages/notice.stories.ts",
      );

      expect(() => {
        checkStoryNames([one, two]);
      }).toThrow(
        `features/fixed-pages (${one.file}) / features/${alias} (${two.file})`,
      );
    },
  );

  test("どちらも PascalCase でも、同じ親のグループに別表記があれば断る", () => {
    expect(() => {
      checkStoryNames([
        file("features/fixed-pages/URLField"),
        file("features/fixed-pages/UrlField"),
      ]);
    }).toThrow("表記の違う名前");
  });

  test("個別の story は export 由来の表示名と、指定した表示名を突き合わせる", () => {
    const group = file("features/fixed-pages/Editor");
    expect(() => {
      checkStoryNames([
        {
          ...group,
          stories: [
            { exportName: "ReadOnly" },
            { exportName: "Alternative", name: "read-only" },
          ],
        },
      ]);
    }).toThrow("表記の違う名前");
  });

  test("別の親に同名の部品や状態があっても、同じ階層の重複には数えない", () => {
    expect(() => {
      checkStoryNames([
        file("features/fixed-pages/Form"),
        file("features/images/Form", "features/images/form.stories.ts"),
        file("components/Form", "components/forms/form.stories.ts"),
      ]);
    }).not.toThrow();
  });

  test.each([
    ["features/FixedPages/Example", "feature のフォルダ名"],
    ["features/images/Example", "feature のフォルダ名"],
    ["features/fixed-pages/PhotoDetails/Example", "kebab-case"],
    ["features/fixed-pages/example-group", "PascalCase"],
    ["screens/Example", "features/"],
    ["features/fixed-pages//Example", "kebab-case"],
  ])("単独の title %s でも規則に合わなければ断る", (title, expected) => {
    expect(() => {
      checkStoryNames([file(title)]);
    }).toThrow(expected);
  });

  test("個別の story の export 名にも PascalCase を使う", () => {
    expect(() => {
      checkStoryNames([
        {
          ...file("features/fixed-pages/Editor"),
          stories: [{ exportName: "readOnly" }],
        },
      ]);
    }).toThrow("export 名");
  });
});

test("開発中の index は編集後の表記揺れを返さず、訂正後は再び返す", async () => {
  const entry = {
    type: "story",
    subtype: "story",
    id: "features-fixed-pages--default",
    importPath: "./src/features/fixed-pages/list/__stories__/notice.stories.ts",
    title: "features/fixed-pages/KindRefreshNotice",
    exportName: "Default",
    name: "Default",
  } as const;

  let title: string = entry.title;

  const generator = withCheckedStoryIndex({
    getIndex: () =>
      Promise.resolve({
        v: 5,
        entries: { [entry.id]: { ...entry, title } },
      }),
  });

  expect((await generator.getIndex()).entries[entry.id].title).toBe(
    entry.title,
  );
  title = "features/FixedPages/KindRefreshNotice";
  expect(generator.getIndex()).rejects.toThrow("fixed-pages");
  title = entry.title;
  expect((await generator.getIndex()).entries[entry.id].title).toBe(
    entry.title,
  );
});
