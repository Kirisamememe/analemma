import { beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Script, createContext } from "node:vm";
import { build, createServer } from "vite";

import { DEV_API_PATH, DEV_ORIGIN } from "../vite.config";

const ADMIN_ROOT = fileURLToPath(new URL("../", import.meta.url));
const SERVER_ENV_EXAMPLE = new URL(
  "../../server/.env.example",
  import.meta.url,
);
const INLINE_SCRIPT = /<script>(?<code>.*?)<\/script>/sv;

/** 本番のビルドの出力のうち、確かめるもの。 */
type Built = {
  /** index.html の中身。 */
  readonly html: string;
  /** CSS のファイルをつないだ中身。 */
  readonly css: string;
};

const buildAdmin = async (): Promise<Built> => {
  const output = await build({
    root: ADMIN_ROOT,
    logLevel: "silent",
    build: { write: false },
  });
  const files = (Array.isArray(output) ? output : [output]).flatMap((result) =>
    "output" in result ? result.output : [],
  );
  const sourceOf = (pattern: RegExp): string =>
    files
      .flatMap((file) =>
        file.type === "asset" && pattern.test(file.fileName)
          ? [file.source]
          : [],
      )
      .map((source) =>
        typeof source === "string" ? source : new TextDecoder().decode(source),
      )
      .join("\n");

  return { html: sourceOf(/^index\.html$/v), css: sourceOf(/\.css$/v) };
};

/** head の script を流す、作り物のブラウザ。 */
type FakeBrowser = {
  /** localStorage に置いてある値。 */
  readonly stored: Readonly<Record<string, string>>;
  /** `navigator.languages`。 */
  readonly languages: readonly string[];
};

/** head の script が html に当てたもの。 */
type Applied = {
  /** html の `lang`。 */
  readonly lang: string;
  /** html の `data-theme`。 */
  readonly theme: string | undefined;
};

const runBootScript = (
  html: string,
  { stored, languages }: FakeBrowser,
): Applied => {
  const dataset: Record<string, string> = {};
  const root = { lang: "", dataset };

  new Script(INLINE_SCRIPT.exec(html)?.groups?.["code"] ?? "").runInContext(
    createContext({
      Intl,
      Set,
      localStorage: { getItem: (key: string) => stored[key] ?? null },
      navigator: { languages },
      document: { documentElement: root },
    }),
  );

  return { lang: root.lang, theme: dataset["theme"] };
};

let built: Built;

beforeAll(async () => {
  built = await buildAdmin();
});

describe("本番のビルド", () => {
  test("CSS の light-dark() を、Lightning CSS の変数に書き換えない", () => {
    expect(built.css).toContain("light-dark(");
    expect(built.css).not.toContain("--lightningcss-");
  });

  test("言語と配色を当てる script を、head の中で、アプリの script より前に置く", () => {
    const head = built.html.slice(0, built.html.indexOf("</head>"));
    const inline = head.indexOf("<script>");

    expect(inline).toBeGreaterThan(-1);
    expect(inline).toBeLessThan(head.indexOf('<script type="module"'));
  });

  test("head の script は、置いてある言語と配色を html に当てる", () => {
    expect(
      runBootScript(built.html, {
        stored: { "analemma:locale": "ja", "analemma:theme": "dark" },
        languages: ["en-US"],
      }),
    ).toEqual({ lang: "ja", theme: "dark" });
  });

  test("head の script は、何も置いていなければブラウザの言語に従い、配色を当てない", () => {
    expect(
      runBootScript(built.html, { stored: {}, languages: ["zh-CN", "en"] }),
    ).toEqual({ lang: "zh-Hans", theme: undefined });
  });
});

describe("開発のときの origin", () => {
  test("server の .env.example の AUTH_ORIGIN と同じ", async () => {
    const env = await readFile(SERVER_ENV_EXAMPLE, "utf8");

    expect(env.split("\n")).toContain(`AUTH_ORIGIN=${DEV_ORIGIN}`);
  });
});

/** 作り物の server が受け取ったリクエスト。 */
type Received = {
  /** パス。 */
  readonly path: string;
  /** Origin ヘッダー。 */
  readonly origin: string | null;
  /** Sec-Fetch-Site ヘッダー。 */
  readonly site: string | null;
};

describe("開発のときのプロキシ", () => {
  test("/api/ で始まるパスを server へ流し、Origin・Sec-Fetch-Site・Set-Cookie をそのまま渡す", async () => {
    using upstream = Bun.serve({
      port: 0,
      fetch: (request) =>
        Response.json(
          {
            path: new URL(request.url).pathname,
            origin: request.headers.get("origin"),
            site: request.headers.get("sec-fetch-site"),
          } satisfies Received,
          {
            headers: {
              "Set-Cookie":
                "analemma_session=token; HttpOnly; SameSite=Strict; Path=/",
            },
          },
        ),
    });
    const server = await createServer({
      root: ADMIN_ROOT,
      logLevel: "silent",
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        port: 0,
        strictPort: false,
        proxy: { [DEV_API_PATH]: { target: upstream.url.origin } },
      },
    });

    await server.listen();

    try {
      const base = server.resolvedUrls?.local[0] ?? "";
      const api = await fetch(new URL("/api/auth/login/options", base), {
        method: "POST",
        headers: { Origin: DEV_ORIGIN, "Sec-Fetch-Site": "same-origin" },
      });
      const page = await fetch(new URL("/api-guide", base));

      expect(await api.json()).toEqual({
        path: "/api/auth/login/options",
        origin: DEV_ORIGIN,
        site: "same-origin",
      });
      expect(api.headers.get("set-cookie")).toBe(
        "analemma_session=token; HttpOnly; SameSite=Strict; Path=/",
      );
      expect(page.headers.get("content-type")).toStartWith("text/html");
    } finally {
      await server.close();
    }
  });
});
