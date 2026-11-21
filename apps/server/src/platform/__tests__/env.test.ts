import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readDatabaseEnv, readEnv } from "../env";

const AUTH = {
  AUTH_ORIGIN: "https://cms.example.com",
  AUTH_RP_ID: "example.com",
} as const;

const DATABASE_URL = "postgres://a:b@db/analemma";

const readError = (source: Record<string, string>): string => {
  try {
    readEnv(source);

    return "";
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "";
  }
};

describe("DATABASE_URL", () => {
  test("ホスト・ポート・DB の名前・ロール・パスワードに分けて読むこと", () => {
    expect(
      readDatabaseEnv({
        DATABASE_URL: "postgres://analemma:p%40ss@db.example:6543/analemma",
      }).database,
    ).toEqual({
      host: "db.example",
      port: 6543,
      database: "analemma",
      username: "analemma",
      password: "p@ss",
    });
  });

  test("ポートを省くと、環境変数ではなく 5432 を使うこと", () => {
    expect(
      readDatabaseEnv({
        DATABASE_URL: "postgresql://analemma:s3cret@db/analemma",
      }).database.port,
    ).toBe(5432);
  });

  test("無いときは、変数の名前を添えて失敗すること", () => {
    expect(readError({ ...AUTH })).toContain("DATABASE_URL: 設定されていない");
  });

  test.each([
    ["ポートが数でない", "postgres://analemma:s3cret@127.0.0.1:bad/analemma"],
    ["ポートが 0", "postgres://analemma:s3cret@127.0.0.1:0/analemma"],
    [
      "ポートが大きすぎる",
      "postgres://analemma:s3cret@127.0.0.1:99999/analemma",
    ],
    ["パスワードに # がある", "postgres://analemma:s3c#ret@127.0.0.1/analemma"],
    ["ホストが空", "postgres://analemma:s3cret@/analemma"],
    ["ホストが無い", "postgres:///analemma"],
    ["ホストが2つ", "postgres://analemma:s3cret@a,b/analemma"],
    ["DB の名前が無い", "postgres://analemma:s3cret@127.0.0.1:5432"],
    ["DB の名前が空", "postgres://analemma:s3cret@127.0.0.1:5432/"],
    [
      "接続先を変えるクエリ引数がある",
      "postgres://analemma:s3cret@db.invalid/x?host=127.0.0.1&port=55433",
    ],
    ["パスワードが無い", "postgres://analemma@127.0.0.1/analemma"],
    [
      "% の並びが壊れている",
      "postgres://analemma:s3cret%ff@127.0.0.1/analemma",
    ],
    ["PostgreSQL の URL でない", "mysql://analemma:s3cret@127.0.0.1/analemma"],
  ])(
    "%s ときは、パスワードを出さずに、変数の名前を添えて失敗すること",
    (_, url) => {
      const message = readError({ ...AUTH, DATABASE_URL: url });

      expect(message).toMatch(/^環境変数が正しくない。\nDATABASE_URL: .+$/v);
      expect(message).not.toContain("s3c");
    },
  );
});

test("PORT を 0 にすると、OS に空いているポートを選ばせられること", () => {
  expect(readEnv({ ...AUTH, PORT: "0", DATABASE_URL }).port).toBe(0);
});

test.each(["", " ", "abc", "70000"])(
  "PORT が %p のように 0〜65535 の数でないと、失敗すること",
  (port) => {
    expect(readError({ ...AUTH, PORT: port, DATABASE_URL })).toContain(
      "PORT: 0〜65535 の数で書く",
    );
  },
);

describe("AUTH_ORIGIN と AUTH_RP_ID", () => {
  test("管理画面の origin と、AUTH_ORIGIN のホストか、その上位のドメインの RP ID を読むこと", () => {
    expect(readEnv({ ...AUTH, DATABASE_URL }).relyingParty).toEqual({
      origin: "https://cms.example.com",
      rpId: "example.com",
    });
    expect(
      readEnv({
        DATABASE_URL,
        AUTH_ORIGIN: "https://example.com",
        AUTH_RP_ID: "example.com",
      }).relyingParty.rpId,
    ).toBe("example.com");
  });

  test("開発のために、http は localhost だけを受け付けること", () => {
    expect(
      readEnv({
        DATABASE_URL,
        AUTH_ORIGIN: "http://localhost:5173",
        AUTH_RP_ID: "localhost",
      }).relyingParty,
    ).toEqual({ origin: "http://localhost:5173", rpId: "localhost" });
    expect(
      readError({
        DATABASE_URL,
        AUTH_ORIGIN: "http://cms.example.com",
        AUTH_RP_ID: "example.com",
      }),
    ).toContain("AUTH_ORIGIN: https で書く");
  });

  test("無いときは、変数の名前を添えて失敗すること", () => {
    expect(readError({ DATABASE_URL, AUTH_RP_ID: "example.com" })).toContain(
      "AUTH_ORIGIN: 設定されていない",
    );
    expect(
      readError({ DATABASE_URL, AUTH_ORIGIN: "https://example.com" }),
    ).toContain("AUTH_RP_ID: 設定されていない");
  });

  test.each([
    "https://cms.example.com/",
    "https://cms.example.com/admin",
    "https://cms.example.com?x=1",
    "https://CMS.example.com",
    "https://cms.example.com:443",
    "cms.example.com",
    "",
  ])("origin の形でない AUTH_ORIGIN %p では、起動しないこと", (origin) => {
    expect(
      readError({
        DATABASE_URL,
        AUTH_ORIGIN: origin,
        AUTH_RP_ID: "example.com",
      }),
    ).toContain("AUTH_ORIGIN: ");
  });

  test.each([
    {
      title: "ほかのドメイン",
      origin: "https://cms.example.com",
      rpId: "example.org",
    },
    {
      title: "下位のドメイン",
      origin: "https://example.com",
      rpId: "cms.example.com",
    },
    {
      title: "ラベルの途中から一致するドメイン",
      origin: "https://cms.myexample.com",
      rpId: "example.com",
    },
  ])(
    "RP ID が AUTH_ORIGIN のホストでも、その上位のドメインでもない($title)と、起動しないこと",
    ({ origin, rpId }) => {
      expect(
        readError({ DATABASE_URL, AUTH_ORIGIN: origin, AUTH_RP_ID: rpId }),
      ).toContain(
        "AUTH_RP_ID: AUTH_ORIGIN のホストか、その上位のドメインで書く",
      );
    },
  );

  test.each([
    "Example.com",
    "example.com:443",
    "https://example.com",
    ".example.com",
    "",
  ])("ドメインの形でない AUTH_RP_ID %p では、起動しないこと", (rpId) => {
    expect(
      readError({
        DATABASE_URL,
        AUTH_ORIGIN: "https://cms.example.com",
        AUTH_RP_ID: rpId,
      }),
    ).toContain("AUTH_RP_ID: 小文字のドメインで書く");
  });
});

test("DB だけを使うコマンドは、AUTH_ORIGIN と AUTH_RP_ID が無くても読めること", () => {
  expect(readDatabaseEnv({ DATABASE_URL }).database.database).toBe("analemma");
});

test(".env.example を写せば、server の環境変数として読めること", () => {
  const example = readFileSync(
    join(import.meta.dirname, "../../../.env.example"),
    "utf8",
  );
  const values = Object.fromEntries(
    example
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [
        line.slice(0, line.indexOf("=")),
        line.slice(line.indexOf("=") + 1),
      ]),
  );

  expect(readEnv(values).relyingParty).toEqual({
    origin: "http://localhost:5173",
    rpId: "localhost",
  });
});
