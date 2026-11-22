import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { build, defineConfig, type Plugin } from "vite";

/** 開発のときに管理画面を配る origin で、server の `AUTH_ORIGIN` と同じ値。 */
export const DEV_ORIGIN = "http://localhost:5173";

/** 開発のときに `/api` を流す先で、server の外部用のポート。 */
export const DEV_API_TARGET = "http://localhost:8787";

/** 開発のときに server へ流すパスの形。 */
export const DEV_API_PATH = "^/api/";

const devServer = {
  host: "localhost",
  port: Number(new URL(DEV_ORIGIN).port),
  strictPort: true,
  proxy: { [DEV_API_PATH]: { target: DEV_API_TARGET } },
};

const BOOT_ENTRY = fileURLToPath(
  new URL("src/preferences/boot.ts", import.meta.url),
);

const bundleBootScript = async (): Promise<string> => {
  const output = await build({
    configFile: false,
    envDir: false,
    logLevel: "warn",
    build: {
      write: false,
      minify: true,
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
  name: "analemma:inline-boot-script",
  transformIndexHtml: {
    order: "pre",
    handler: async () => [
      { tag: "script", children: await bundleBootScript(), injectTo: "head" },
    ],
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineBootScript()],
  server: devServer,
  preview: devServer,
  build: {
    cssTarget: ["chrome123", "safari17.5", "firefox128"],
  },
});
