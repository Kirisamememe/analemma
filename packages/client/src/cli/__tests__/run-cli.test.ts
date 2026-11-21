import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { describe, expect, test } from "bun:test";

import { contract } from "@analemma/contract";

import { defineKind } from "../../kinds/define-kind";
import { text } from "../../kinds/scalar-fields";
import { type CliIo, runCli } from "../run-cli";

const TOKEN = `${"A".repeat(22)}.${"B".repeat(43)}`;

const about = defineKind({
  name: "about",
  label: "自己紹介",
  fields: { headline: text({ label: "見出し" }) },
});

/** 偽の CMS の答え方。 */
type Answer = "accept" | "incompatible" | "unauthorized";

/** CLI を流した結果。 */
type CliRun = {
  /** 終了コード。 */
  readonly code: number;
  /** 標準出力に書いた行。 */
  readonly stdout: string[];
  /** 標準エラーに書いた行。 */
  readonly stderr: string[];
  /** 偽の CMS が受け取ったリクエストの Authorization ヘッダー。 */
  readonly received: (string | null)[];
};

const os = implement({ deploy: contract.deploy });

const serveFakeCms = (answer: Answer, received: (string | null)[]) => {
  const handler = new RPCHandler(
    os.router({
      deploy: {
        kinds: {
          push: os.deploy.kinds.push.handler(({ errors, input }) => {
            switch (answer) {
              case "accept":
                return {
                  kinds: input.kinds.map(({ name }) => ({
                    name,
                    change: "created" as const,
                  })),
                };
              case "incompatible":
                throw errors.INCOMPATIBLE_PAGES({
                  data: {
                    pages: [
                      {
                        kind: "about",
                        id: "0190b5e0-0000-7000-8000-000000000000",
                        slug: "about",
                        title: "自己紹介",
                        issues: [
                          {
                            path: ["headline"],
                            code: "invalid_type",
                            message: "Invalid input",
                          },
                        ],
                      },
                    ],
                  },
                });
              case "unauthorized":
                throw errors.UNAUTHORIZED();
            }
          }),
        },
      },
    }),
  );

  return async (request: Request): Promise<Response> => {
    received.push(request.headers.get("authorization"));

    const { response } = await handler.handle(request, {
      prefix: "/api",
      context: {},
    });

    return response ?? new Response(null, { status: 404 });
  };
};

const run = async (
  answer: Answer,
  io: Partial<CliIo> = {},
): Promise<CliRun> => {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const received: (string | null)[] = [];
  const code = await runCli({
    args: ["push-kinds", "./kinds.ts"],
    url: "http://127.0.0.1:8788",
    token: TOKEN,
    loadModule: () => Promise.resolve({ default: [about] }),
    fetch: serveFakeCms(answer, received),
    write: (line) => {
      stdout.push(line);
    },
    writeError: (line) => {
      stderr.push(line);
    },
    ...io,
  });

  return { code, stdout, stderr, received };
};

describe("種類の定義を送る CLI", () => {
  test("default export の種類の定義を、トークンを添えて送り、受け付けられたら 0 で終わること", async () => {
    const result = await run("accept");

    expect(result).toEqual({
      code: 0,
      stdout: ["種類の定義を送った(1 件)。", "- about: 作った"],
      stderr: [],
      received: [`Bearer ${TOKEN}`],
    });
  });

  test("既存のページに合わずに断られたら、合わないページを標準エラーに書き、1 で終わること", async () => {
    const result = await run("incompatible");

    expect(result.code).toBe(1);
    expect(result.stderr).toEqual([
      "種類の定義を断られた。次の固定ページの中身が、新しい定義に合わない。",
      "- about / about(自己紹介)",
      "  - headline: Invalid input",
    ]);
  });

  test("トークンを断られたら、1 で終わること", async () => {
    const result = await run("unauthorized");

    expect(result.code).toBe(1);
    expect(result.stderr[0]).toContain("ANALEMMA_DEPLOY_TOKEN");
  });

  test("--url を渡すと、環境変数の URL より優先すること", async () => {
    const urls: string[] = [];
    const fake = serveFakeCms("accept", []);
    const result = await run("accept", {
      args: ["push-kinds", "./kinds.ts", "--url", "http://10.0.0.2:9000"],
      fetch: async (request) => {
        urls.push(request.url);

        return fake(request);
      },
    });

    expect(result.code).toBe(0);
    expect(urls).toEqual(["http://10.0.0.2:9000/api/deploy/kinds/push"]);
  });

  test.each([
    { title: "コマンドが無い", io: { args: [] } },
    { title: "知らないコマンド", io: { args: ["pull-kinds", "./kinds.ts"] } },
    { title: "定義のファイルが無い", io: { args: ["push-kinds"] } },
    { title: "トークンが無い", io: { token: undefined } },
    { title: "URL が無い", io: { url: undefined } },
    { title: "http でない URL", io: { url: "ftp://127.0.0.1" } },
  ])(
    "$title ときは、何も送らずに使い方を書き、2 で終わること",
    async ({ io }) => {
      const result = await run("accept", io);

      expect(result.code).toBe(2);
      expect(result.received).toEqual([]);
      expect(result.stderr.join("\n")).toContain("使い方: analemma push-kinds");
    },
  );

  test.each([
    { title: "配列を default export しない", module: { default: about } },
    { title: "default export が無い", module: { about } },
    {
      title: "種類でないものが入っている",
      module: { default: [{ definition: { name: "Bad" } }] },
    },
  ])(
    "$title 定義のファイルでは、何も送らずに 1 で終わること",
    async ({ module }) => {
      const result = await run("accept", {
        loadModule: () => Promise.resolve(module),
      });

      expect(result.code).toBe(1);
      expect(result.received).toEqual([]);
      expect(result.stderr[0]).toStartWith("種類の定義を読めない。");
    },
  );
});
