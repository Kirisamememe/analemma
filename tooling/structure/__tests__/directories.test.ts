import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import drizzleConfig from "../../../apps/server/drizzle.config";
import {
  GENERATED_DIRECTORIES,
  findBadDirectories,
  findCrowdedDirectories,
} from "../directories";
import { findStrayStoryFiles } from "../story-files";

describe("中身が多すぎるフォルダ", () => {
  test("上限を超えたフォルダだけを、中身の数と一緒に返すこと", () => {
    const paths = [
      "src/a.ts",
      "src/b.ts",
      "src/c.ts",
      "src/inner/d.ts",
      "lib/a.ts",
    ];

    expect(findCrowdedDirectories({ limit: 3, paths })).toEqual([
      { directory: "src", entries: 4 },
    ]);
  });

  test("__tests__・__stories__ と文書は数えないこと", () => {
    const paths = [
      "src/a.ts",
      "src/__tests__/a.test.ts",
      "src/__stories__/a.stories.tsx",
      "src/AGENTS.md",
      "src/CLAUDE.md",
      "src/DECISIONS.md",
      "src/README.md",
    ];

    expect(findCrowdedDirectories({ limit: 1, paths })).toEqual([]);
  });

  test("リポジトリの直下と、. で始まるフォルダの中は、件数を検査しないこと", () => {
    const paths = ["a.ts", "b.ts", ".github/workflows/a.yml", ".github/b.yml"];

    expect(findCrowdedDirectories({ limit: 1, paths })).toEqual([]);
  });
});

describe("フォルダの名前", () => {
  test("kebab-case でない名前を返すこと", () => {
    const paths = [
      "src/myFeature/a.ts",
      "src/my_feature/a.ts",
      "src/ok-name/a.ts",
    ];

    expect(findBadDirectories(paths)).toEqual([
      "src/myFeature",
      "src/my_feature",
    ]);
  });

  test("__tests__ と __stories__ の中のフォルダを返すこと", () => {
    const paths = [
      "src/__tests__/deep/a.test.ts",
      "src/__tests__/b.test.ts",
      "apps/admin/src/__stories__/deep/a.stories.tsx",
    ];

    expect(findBadDirectories(paths)).toEqual([
      "apps/admin/src/__stories__/deep",
      "src/__tests__/deep",
    ]);
  });

  test("__tests__・__stories__ と、. で始まるフォルダは受け入れること", () => {
    const paths = [
      "src/__tests__/a.test.ts",
      "apps/admin/src/__stories__/a.stories.tsx",
      ".claude/settings.json",
    ];

    expect(findBadDirectories(paths)).toEqual([]);
  });
});

describe("story の置き場所", () => {
  test("管理画面の src の外の __stories__ を返すこと", () => {
    const paths = [
      "apps/admin/src/ui/__stories__/a.stories.tsx",
      "apps/server/src/__stories__/a.stories.tsx",
    ];

    expect(findBadDirectories(paths)).toEqual(["apps/server/src/__stories__"]);
  });

  test("__stories__ の中の story でないファイルと、__stories__ の外の story を返すこと", () => {
    const paths = [
      "apps/admin/src/ui/__stories__/a.stories.tsx",
      "apps/admin/src/ui/__stories__/b.stories.ts",
      "apps/admin/src/ui/__stories__/helper.ts",
      "apps/admin/src/ui/a.stories.tsx",
      "apps/admin/src/ui/b.stories.ts",
    ];

    expect(findStrayStoryFiles(paths)).toEqual([
      "apps/admin/src/ui/__stories__/helper.ts",
      "apps/admin/src/ui/a.stories.tsx",
      "apps/admin/src/ui/b.stories.ts",
    ]);
  });
});

describe("drizzle-kit が書き出す migration のフォルダ", () => {
  const migrations = Array.from(
    { length: 11 },
    (_, index) =>
      `apps/server/src/db/migrations/202611210702${String(index).padStart(2, "0")}_create-notes/migration.sql`,
  );

  test("中は、名前も数も検査しないこと", () => {
    expect(findCrowdedDirectories({ limit: 10, paths: migrations })).toEqual(
      [],
    );
    expect(findBadDirectories(migrations)).toEqual([]);
  });

  test("migration のフォルダも、親のフォルダでは1件と数えること", () => {
    const paths = [...migrations, "apps/server/src/db/migrate.ts"];

    expect(findCrowdedDirectories({ limit: 1, paths })).toContainEqual({
      directory: "apps/server/src/db",
      entries: 2,
    });
  });

  test("ほかのフォルダは、名前が似ていても検査すること", () => {
    const paths = [
      "apps/server/src/db/migrations-old/20261121070200_create-notes/migration.sql",
      "apps/server/src/db/schema/20261121070200_create-notes/notes.ts",
      "apps/admin/src/db/migrations/20261121070200_create-notes/migration.sql",
    ];

    expect(findBadDirectories(paths)).toEqual([
      "apps/admin/src/db/migrations/20261121070200_create-notes",
      "apps/server/src/db/migrations-old/20261121070200_create-notes",
      "apps/server/src/db/schema/20261121070200_create-notes",
    ]);
  });
});

test("drizzle-kit の書き出し先を、生成物のフォルダとして、検査からも整形からも外していること", () => {
  const out = join("apps/server", drizzleConfig.out ?? "");

  const oxfmt: unknown = JSON.parse(
    readFileSync(join(import.meta.dirname, "../../../.oxfmtrc.json"), "utf8"),
  );

  const ignorePatterns =
    typeof oxfmt === "object" &&
    oxfmt !== null &&
    "ignorePatterns" in oxfmt &&
    Array.isArray(oxfmt.ignorePatterns)
      ? oxfmt.ignorePatterns
      : [];

  expect(GENERATED_DIRECTORIES).toContain(out);
  expect(ignorePatterns).toContain(`${out}/**`);
});
