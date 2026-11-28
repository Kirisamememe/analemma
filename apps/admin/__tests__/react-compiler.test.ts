import { Glob } from "bun";
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { transformSync } from "oxc-transform-react";

const ADMIN_ROOT = fileURLToPath(new URL("../", import.meta.url));
const NOT_PRODUCT = /__(?:tests|stories)__\/|^src\/testing\//v;

test("管理画面のどのファイルも、React Compiler が診断を出さずに変換できる", async () => {
  const paths = await Array.fromAsync(
    new Glob("{src,.storybook}/**/*.{ts,tsx}").scan({
      cwd: ADMIN_ROOT,
      dot: true,
    }),
  );

  const diagnosed = await Promise.all(
    paths
      .filter((path) => !NOT_PRODUCT.test(path))
      .map(async (path) => {
        const source = await Bun.file(`${ADMIN_ROOT}${path}`).text();

        const { errors } = transformSync(path, source, {
          jsx: "preserve",
          reactCompiler: { reportDiagnostics: true },
        });

        return errors.map(({ message }) => `${path}: ${message}`);
      }),
  );

  expect(paths.length).toBeGreaterThan(100);
  expect(diagnosed.flat()).toEqual([]);
});
