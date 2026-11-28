import { plugin } from "bun";
import { transformSync } from "oxc-transform-react";

const PRODUCT_CODE =
  /apps\/admin\/src\/(?!testing\/)(?!.*__(?:tests|stories)__\/).*\.tsx?$/v;

plugin({
  name: "analemma:react-compiler",
  setup: (build) => {
    build.onLoad({ filter: PRODUCT_CODE }, async ({ path }) => {
      const source = await Bun.file(path).text();

      const result = transformSync(path, source, {
        jsx: "preserve",
        reactCompiler: true,
      });

      if (result.fatal) {
        throw new Error(result.errors.map(({ message }) => message).join("\n"));
      }

      return { contents: result.code, loader: "jsx" };
    });
  },
});
