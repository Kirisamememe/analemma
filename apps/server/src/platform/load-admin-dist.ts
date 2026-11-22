import { join, resolve } from "node:path";

/** 起動時に読み込んだ管理画面のビルド。 */
export type AdminDist = {
  /** 配信する URL のパスとファイル。 */
  readonly files: ReadonlyMap<string, Blob>;
  /** SPA の入口の index.html の本文。 */
  readonly index: string;
  /** index.html の inline script を許す CSP の hash。 */
  readonly scriptHashes: readonly string[];
};

const inlineScriptHashes = async (html: string): Promise<string[]> => {
  const scripts: string[] = [];
  let source = "";

  new HTMLRewriter()
    .on("script:not([src])", {
      element(element) {
        source = "";
        element.onEndTag(() => {
          scripts.push(source.replaceAll(/\r\n?/gv, "\n"));
        });
      },
      text(chunk) {
        source += chunk.text;
      },
    })
    .transform(html);

  return Promise.all(
    scripts.map(async (script) => {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(script),
      );

      return `'sha256-${new Uint8Array(digest).toBase64()}'`;
    }),
  );
};

/** 配信するファイルを読み、index.html の script の hash を求める。 */
export const loadAdminDist = async (directory: string): Promise<AdminDist> => {
  const cwd = resolve(directory);
  const files = new Map<string, Blob>();
  const paths = new Bun.Glob("**/*").scan({
    cwd,
    dot: false,
    followSymlinks: false,
    onlyFiles: true,
  });

  for await (const path of paths) {
    const file = Bun.file(join(cwd, path));
    files.set(
      `/${path}`,
      new Blob([await file.arrayBuffer()], { type: file.type }),
    );
  }

  const index = await files.get("/index.html")?.text();

  if (index === undefined) {
    throw new Error("配信するフォルダに index.html が無い");
  }

  if (!index.includes("<head>")) {
    throw new Error("index.html に <head> が無い");
  }

  return { files, index, scriptHashes: await inlineScriptHashes(index) };
};
