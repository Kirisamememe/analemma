import { storyNameFromExport } from "storybook/internal/csf";
import type { IndexInput } from "storybook/internal/types";

type StoryFile = {
  /** src からの相対パス。 */
  file: string;
  /** CSF の title。 */
  title: string;
  /** サイドバーに並ぶ story。 */
  stories: readonly Pick<IndexInput, "exportName" | "name">[];
};

const FOLDER = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/v;
const GROUP = /^[A-Z][A-Za-z0-9]*$/v;

const rootFor = (file: string): string => {
  const [area, layer] = file.split("/");

  if (area === "routes") return "screens";

  if (area === "ui" && layer === "specimens") return "theme";

  if (
    area === "ui" &&
    (layer === "layout" || layer === "patterns" || layer === "primitives")
  ) {
    return layer;
  }

  if (area === "features" || area === "components") return area;

  throw new Error(`Storybook の分類が決まっていない場所です: ${file}`);
};

/** サイドバーの同じ階層での表記の重複と、分類名の書き方を検査する。 */
export const checkStoryNames = (files: readonly StoryFile[]): void => {
  const names = new Map<string, Pick<StoryFile, "title" | "file">>();

  const register = (parts: string[], file: string): void => {
    const path = parts.join("/");
    const key = path.replaceAll(/[\s_\-]/gv, "").toLowerCase();
    const existing = names.get(key);

    if (existing !== undefined && existing.title !== path) {
      throw new Error(
        `Storybook の同じ階層に表記の違う名前があります: ${existing.title} (${existing.file}) / ${path} (${file})`,
      );
    }

    names.set(key, { title: path, file });
  };

  for (const { file, title, stories } of files) {
    const parts = title.split("/");

    for (let depth = 1; depth <= parts.length; depth += 1) {
      register(parts.slice(0, depth), file);
    }

    for (const story of stories) {
      register(
        [...parts, story.name ?? storyNameFromExport(story.exportName)],
        file,
      );
    }
  }

  for (const { file, title, stories } of files) {
    const parts = title.split("/");
    const root = rootFor(file);

    if (parts.length < 2 || parts[0] !== root) {
      throw new Error(
        `Storybook の title は ${root}/ で始め、末尾にグループ名を書きます: ${title} (${file})`,
      );
    }

    if (
      root === "features" &&
      (parts.length < 3 || parts[1] !== file.split("/")[1])
    ) {
      throw new Error(
        `Storybook の feature のフォルダ名を src/features の名前にそろえます: ${title} (${file})`,
      );
    }

    if (
      !parts.slice(0, -1).every((name) => FOLDER.test(name)) ||
      !GROUP.test(parts.at(-1) ?? "")
    ) {
      throw new Error(
        `Storybook のフォルダ名は kebab-case、末尾のグループ名は PascalCase で書きます: ${title} (${file})`,
      );
    }

    for (const { exportName } of stories) {
      if (!GROUP.test(exportName)) {
        throw new Error(
          `Storybook の story の export 名は PascalCase で書きます: ${exportName} (${file})`,
        );
      }
    }
  }
};
