import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { build, defineConfig, type Plugin } from "vite";

/** 開発のときに管理画面を配る origin で、server の `AUTH_ORIGIN` と同じ値。 */
export const DEV_ORIGIN = "http://localhost:5173";

/** 開発のときに `/api` と `/media` を流す先で、server の外部用のポート。 */
export const DEV_SERVER_TARGET = "http://localhost:8787";

/** 開発のときに server へ流すパスの形。 */
export const DEV_PROXY_PATH = "^/(?:api|media)/";

/** 出力の JS と CSS が対応するブラウザ。 */
export const BROWSER_TARGET = "esnext";

/** html の head に、最初の描画の前に流す script を書き込む plugin の名前。 */
export const BOOT_SCRIPT_PLUGIN = "analemma:inline-boot-script";

const resolve = { tsconfigPaths: true };

const devServer = {
  host: "localhost",
  port: Number(new URL(DEV_ORIGIN).port),
  strictPort: true,
  proxy: { [DEV_PROXY_PATH]: { target: DEV_SERVER_TARGET } },
};

const BOOT_ENTRY = fileURLToPath(
  new URL("src/preferences/boot.ts", import.meta.url),
);

const bundleBootScript = async (): Promise<string> => {
  const output = await build({
    configFile: false,
    envDir: false,
    logLevel: "warn",
    resolve,
    build: {
      write: false,
      minify: true,
      target: BROWSER_TARGET,
      lib: { entry: BOOT_ENTRY, formats: ["iife"], name: "boot" },
    },
  });

  const chunk = (Array.isArray(output) ? output : [output])
    .flatMap((result) => ("output" in result ? result.output : []))
    .find((item) => item.type === "chunk");

  if (chunk === undefined) {
    throw new Error("最初の描画の前に流す script を組み立てられませんでした");
  }

  return chunk.code;
};

const inlineBootScript = (): Plugin => ({
  name: BOOT_SCRIPT_PLUGIN,
  transformIndexHtml: {
    order: "pre",
    handler: async () => [
      { tag: "script", children: await bundleBootScript(), injectTo: "head" },
    ],
  },
});

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    inlineBootScript(),
  ],
  resolve,
  server: devServer,
  preview: devServer,
  build: {
    target: BROWSER_TARGET,
    cssTarget: BROWSER_TARGET,
    modulePreload: { polyfill: false },
  },
});
