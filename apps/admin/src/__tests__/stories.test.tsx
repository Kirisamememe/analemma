import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { readdir } from "node:fs/promises";
import type { ComponentType } from "react";

import preview from "../../.storybook/preview";
import * as layoutAppShell from "../ui/layout/__stories__/app-shell.stories";
import * as layoutCenter from "../ui/layout/__stories__/center.stories";
import * as layoutCluster from "../ui/layout/__stories__/cluster.stories";
import * as layoutHeading from "../ui/layout/__stories__/heading.stories";
import * as layoutStack from "../ui/layout/__stories__/stack.stories";
import * as layoutText from "../ui/layout/__stories__/text.stories";
import * as patternsPageHeader from "../ui/patterns/__stories__/page-header.stories";
import * as primitivesBadge from "../ui/primitives/__stories__/badge.stories";
import * as primitivesButton from "../ui/primitives/__stories__/button.stories";
import * as primitivesDialog from "../ui/primitives/__stories__/dialog.stories";
import * as primitivesForm from "../ui/primitives/__stories__/form.stories";
import * as primitivesLink from "../ui/primitives/__stories__/link.stories";
import * as primitivesNotice from "../ui/primitives/__stories__/notice.stories";
import * as primitivesSpinner from "../ui/primitives/__stories__/spinner.stories";
import * as primitivesTextField from "../ui/primitives/__stories__/text-field.stories";
import * as specimensColors from "../ui/specimens/__stories__/colors.stories";
import * as specimensTypography from "../ui/specimens/__stories__/typography.stories";

const MODULES = {
  "ui/layout/__stories__/app-shell.stories.tsx": layoutAppShell,
  "ui/layout/__stories__/center.stories.tsx": layoutCenter,
  "ui/layout/__stories__/cluster.stories.tsx": layoutCluster,
  "ui/layout/__stories__/heading.stories.tsx": layoutHeading,
  "ui/layout/__stories__/stack.stories.tsx": layoutStack,
  "ui/layout/__stories__/text.stories.tsx": layoutText,
  "ui/patterns/__stories__/page-header.stories.tsx": patternsPageHeader,
  "ui/primitives/__stories__/badge.stories.tsx": primitivesBadge,
  "ui/primitives/__stories__/button.stories.tsx": primitivesButton,
  "ui/primitives/__stories__/dialog.stories.tsx": primitivesDialog,
  "ui/primitives/__stories__/form.stories.tsx": primitivesForm,
  "ui/primitives/__stories__/link.stories.tsx": primitivesLink,
  "ui/primitives/__stories__/notice.stories.tsx": primitivesNotice,
  "ui/primitives/__stories__/spinner.stories.tsx": primitivesSpinner,
  "ui/primitives/__stories__/text-field.stories.tsx": primitivesTextField,
  "ui/specimens/__stories__/colors.stories.tsx": specimensColors,
  "ui/specimens/__stories__/typography.stories.tsx": specimensTypography,
};

const STORY_FILE = /(?:^|\/)__stories__\/[^\/]+\.stories\.tsx$/v;

setProjectAnnotations(preview);

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("lang");
  delete document.documentElement.dataset["theme"];
});

const STORIES = Object.entries(MODULES).flatMap(([file, module]) =>
  Object.entries<ComponentType>(composeStories(module)).map(
    ([name, Story]) => ({
      file,
      name,
      Story,
    }),
  ),
);

describe("story", () => {
  test("src の story のファイルを、どれも描く対象に入れている", async () => {
    const files = await readdir(new URL("..", import.meta.url), {
      recursive: true,
    });

    expect(
      Object.values(MODULES).filter(
        (module) => Object.keys(composeStories(module)).length === 0,
      ),
    ).toEqual([]);
    expect(files.filter((path) => STORY_FILE.test(path)).toSorted()).toEqual(
      Object.keys(MODULES).toSorted(),
    );
  });

  test("ツールバーの配色と言語を、html の属性と部品の訳に渡す(見本の文の言語は lang に残す)", () => {
    const { Pending } = composeStories(primitivesButton, {
      initialGlobals: { theme: "dark", locale: "zh-Hans" },
    });

    render(<Pending />);

    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(document.documentElement.lang).toBe("ja");
    expect(screen.getByRole("progressbar", { name: "正在处理" })).toBeDefined();
  });

  test.each(STORIES)("$file の $name を、誤りを出さずに描ける", ({ Story }) => {
    const errors = spyOn(console, "error");

    try {
      const { container } = render(<Story />);

      expect(container.childElementCount).toBeGreaterThan(0);
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});
