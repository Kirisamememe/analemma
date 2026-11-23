import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { createExternalApp, createInternalApp } from "@/app";
import { createChallengeStore } from "@/features/auth/challenge/create-challenge-store";
import { systemClock } from "@/platform/clock";
import { openDatabase } from "@/platform/database";
import { readEnv } from "@/platform/env";
import { loadAdminDist } from "@/platform/load-admin-dist";
import { stdoutLogger } from "@/platform/logger";

const ORIGIN = "https://cms.example.com";

const ENV = {
  DATABASE_URL: "postgres://test:test@127.0.0.1:1/test",
  AUTH_ORIGIN: ORIGIN,
  AUTH_RP_ID: "cms.example.com",
};

const BOOT = "\n  document.documentElement.lang = 'ja';\n";
const SECOND = "window.ready = true;";
const INDEX = `<!doctype html><html><head><!-- <script>ignored</script> --><script>${BOOT.replaceAll("\n", "\r\n")}</script><script src="/assets/index-abc.js">ignored</script><script>${SECOND}</script></head><body>Stilus</body></html>`;
const ASSET = "export default 1;";
const env = readEnv(ENV);
const database = openDatabase({ target: env.database, logger: stdoutLogger });

const context = {
  db: database.db,
  relyingParty: env.relyingParty,
  logger: stdoutLogger,
  clock: systemClock,
  challenges: createChallengeStore({ capacity: 1, lifetimeMs: 1000 }),
};

const root = await mkdtemp(join(tmpdir(), "analemma-admin-dist-"));
const dir = join(root, "dist");
let app: ReturnType<typeof createExternalApp>;

const readNonce = (response: Response): string | undefined =>
  /'nonce-([^']+)'/v.exec(
    response.headers.get("content-security-policy") ?? "",
  )?.[1];

const withoutCsp = (response: Response): [string, string][] =>
  [...response.headers].filter(([name]) => name !== "content-security-policy");

beforeAll(async () => {
  await mkdir(join(dir, "assets"), { recursive: true });
  await writeFile(join(dir, "index.html"), INDEX);
  await writeFile(join(dir, "assets/index-abc.js"), ASSET);
  await writeFile(join(dir, "assets/index-abc.css"), "body {}");
  await writeFile(join(dir, "favicon.svg"), "<svg/>");
  await writeFile(join(dir, ".hidden"), "private");
  await writeFile(join(root, "outside"), "private");
  await symlink(root, join(dir, "assets/link"));
  await symlink(join(root, "outside"), join(dir, "assets/file-link"));
  app = createExternalApp(
    context,
    await loadAdminDist(relative(process.cwd(), dir)),
  );
});

afterAll(async () => {
  await database[Symbol.asyncDispose]();
  await rm(root, { recursive: true, force: true });
});

describe("管理画面の静的ファイル", () => {
  test.each(["/", "/index.html", "/fixed-pages/abc?edit=1", "/apiary"])(
    "%s を別のサイトのリンクから開いても、管理画面とその CSP を返すこと",
    async (path) => {
      const response = await app.request(path, {
        headers: { "sec-fetch-site": "cross-site" },
      });

      const csp = response.headers.get("content-security-policy");

      const hashes = [BOOT, SECOND].map(
        (script) =>
          `'sha256-${createHash("sha256").update(script).digest("base64")}'`,
      );

      const nonce = readNonce(response);

      expect(response.status).toBe(200);
      expect(nonce).toBeString();
      expect(await response.text()).toBe(
        INDEX.replace(
          "<head>",
          `<head><meta name="csp-nonce" content="${nonce}">`,
        ),
      );
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(csp?.split("; ")).toContain(
        ["script-src 'self'", ...hashes].join(" "),
      );
      expect(csp?.split("; ")).toContain(`style-src 'self' 'nonce-${nonce}'`);
      expect(csp).toContain("frame-ancestors 'none'");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("permissions-policy")).toContain(
        "publickey-credentials-create=(self)",
      );
    },
  );

  test("index.html の style の nonce は、応答ごとに変わること", async () => {
    const first = readNonce(await app.request("/"));
    const second = readNonce(await app.request("/"));

    expect(first).toBeString();
    expect(second).not.toBe(first);
  });

  test.each([
    {
      path: "/assets/index-abc.js",
      mime: "javascript",
      cache: "public, max-age=31536000, immutable",
      body: ASSET,
    },
    {
      path: "/assets/index-abc.css",
      mime: "text/css",
      cache: "public, max-age=31536000, immutable",
      body: "body {}",
    },
    {
      path: "/favicon.svg",
      mime: "image/svg+xml",
      cache: "no-cache",
      body: "<svg/>",
    },
  ])(
    "$path には拡張子に合う Content-Type と Cache-Control が付くこと",
    async ({ path, mime, cache, body }) => {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(mime);
      expect(response.headers.get("cache-control")).toBe(cache);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(await response.text()).toBe(body);
    },
  );

  test.each(["/assets/index-abc.js", "/fixed-pages/abc"])(
    "HEAD %s には、CSP の nonce のほかは GET と同じヘッダーが付き、本文は空になること",
    async (path) => {
      const get = await app.request(path);
      const head = await app.request(path, { method: "HEAD" });
      expect(head.status).toBe(200);
      expect(withoutCsp(head)).toEqual(withoutCsp(get));
      expect(readNonce(head)).toBeString();
      expect(await head.text()).toBe("");
    },
  );

  test.each([
    "/api",
    "/api/",
    "/api/missing",
    "/assets/missing.js",
    "/%2ehidden",
    "/assets/%2e%2e%2foutside",
    "/assets/link/outside",
    "/assets/file-link",
  ])("%s は 404 になること", async (path) => {
    const response = await app.request(path);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("private");
  });

  test.each(["/api", "/api/missing"])(
    "%s には API のメソッド制限と CSRF の確認が掛かること",
    async (path) => {
      const head = await app.request(path, { method: "HEAD" });

      const form = await app.request(path, {
        method: "POST",
        headers: {
          "content-type": "text/plain",
          origin: "https://other.example",
        },
      });

      expect(head.status).toBe(405);
      expect(head.headers.get("allow")).toBe("GET, POST");
      expect(form.status).toBe(403);
    },
  );

  test.each(["POST", "PATCH", "OPTIONS"])(
    "%s では、Origin や Content-Type を問わず 405 を返すこと",
    async (method) => {
      const response = await app.request("/fixed-pages/abc", {
        method,
        headers: {
          origin: "https://other.example",
          "content-type": "text/plain",
        },
      });

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET, HEAD");
    },
  );

  test("配信しない設定と内部用のポートでは管理画面を返さないこと", async () => {
    expect((await createExternalApp(context).request("/")).status).toBe(404);
    expect((await createInternalApp(context).request("/")).status).toBe(404);
  });

  test.each(["missing", ".", "outside"])(
    "ADMIN_DIST_DIR=%s から index.html を読めないと server が起動しないこと",
    (path) => {
      const result = spawnSync(
        process.execPath,
        ["--no-env-file", join(import.meta.dirname, "../main.ts")],
        {
          cwd: root,
          env: { ...ENV, ADMIN_DIST_DIR: path },
          encoding: "utf8",
          timeout: 5000,
        },
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("ADMIN_DIST_DIR");
    },
  );
});
