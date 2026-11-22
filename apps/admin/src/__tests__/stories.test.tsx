import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { readdir } from "node:fs/promises";
import type { ComponentType } from "react";

import preview from "../../.storybook/preview";

import * as componentsPasskeyNameField from "@/components/__stories__/passkey-name-field.stories";
import * as componentsForm from "@/components/forms/__stories__/form.stories";
import * as routesEnrollPage from "@/routes/__stories__/enroll-page.stories";
import * as routesLoginPage from "@/routes/__stories__/login-page.stories";
import * as routesSecurityPage from "@/routes/__stories__/security-page.stories";
import * as layoutAppShell from "@/ui/layout/__stories__/app-shell.stories";
import * as layoutCenter from "@/ui/layout/__stories__/center.stories";
import * as layoutCluster from "@/ui/layout/__stories__/cluster.stories";
import * as layoutHeading from "@/ui/layout/__stories__/heading.stories";
import * as layoutStack from "@/ui/layout/__stories__/stack.stories";
import * as layoutText from "@/ui/layout/__stories__/text.stories";
import * as patternsPageHeader from "@/ui/patterns/__stories__/page-header.stories";
import * as patternsSideNav from "@/ui/patterns/__stories__/side-nav.stories";
import * as primitivesBadge from "@/ui/primitives/__stories__/badge.stories";
import * as primitivesButton from "@/ui/primitives/__stories__/button.stories";
import * as primitivesFocusScope from "@/ui/primitives/__stories__/focus-scope.stories";
import * as primitivesForm from "@/ui/primitives/__stories__/form.stories";
import * as primitivesNotice from "@/ui/primitives/__stories__/notice.stories";
import * as primitivesNumberField from "@/ui/primitives/form-fields/__stories__/number-field.stories";
import * as primitivesTextArea from "@/ui/primitives/form-fields/__stories__/text-area.stories";
import * as primitivesTextField from "@/ui/primitives/form-fields/__stories__/text-field.stories";
import * as primitivesTextInput from "@/ui/primitives/form-fields/__stories__/text-input.stories";
import * as primitivesAppMark from "@/ui/primitives/graphics/__stories__/app-mark.stories";
import * as primitivesIcon from "@/ui/primitives/graphics/__stories__/icon.stories";
import * as primitivesSpinner from "@/ui/primitives/graphics/__stories__/spinner.stories";
import * as primitivesLink from "@/ui/primitives/navigation/__stories__/link.stories";
import * as primitivesNavDrawer from "@/ui/primitives/navigation/__stories__/nav-drawer.stories";
import * as primitivesNavItem from "@/ui/primitives/navigation/__stories__/nav-item.stories";
import * as primitivesDialog from "@/ui/primitives/overlays/__stories__/dialog.stories";
import * as primitivesToast from "@/ui/primitives/overlays/__stories__/toast.stories";
import * as specimensColors from "@/ui/specimens/__stories__/colors.stories";
import * as specimensTypography from "@/ui/specimens/__stories__/typography.stories";

const MODULES = {
  "components/forms/__stories__/form.stories.tsx": componentsForm,
  "components/__stories__/passkey-name-field.stories.tsx":
    componentsPasskeyNameField,
  "routes/__stories__/enroll-page.stories.tsx": routesEnrollPage,
  "routes/__stories__/login-page.stories.tsx": routesLoginPage,
  "routes/__stories__/security-page.stories.tsx": routesSecurityPage,
  "ui/layout/__stories__/app-shell.stories.tsx": layoutAppShell,
  "ui/layout/__stories__/center.stories.tsx": layoutCenter,
  "ui/layout/__stories__/cluster.stories.tsx": layoutCluster,
  "ui/layout/__stories__/heading.stories.tsx": layoutHeading,
  "ui/layout/__stories__/stack.stories.tsx": layoutStack,
  "ui/layout/__stories__/text.stories.tsx": layoutText,
  "ui/patterns/__stories__/page-header.stories.tsx": patternsPageHeader,
  "ui/patterns/__stories__/side-nav.stories.tsx": patternsSideNav,
  "ui/primitives/__stories__/badge.stories.tsx": primitivesBadge,
  "ui/primitives/__stories__/button.stories.tsx": primitivesButton,
  "ui/primitives/__stories__/focus-scope.stories.tsx": primitivesFocusScope,
  "ui/primitives/__stories__/form.stories.tsx": primitivesForm,
  "ui/primitives/__stories__/notice.stories.tsx": primitivesNotice,
  "ui/primitives/form-fields/__stories__/number-field.stories.tsx":
    primitivesNumberField,
  "ui/primitives/form-fields/__stories__/text-area.stories.tsx":
    primitivesTextArea,
  "ui/primitives/form-fields/__stories__/text-field.stories.tsx":
    primitivesTextField,
  "ui/primitives/form-fields/__stories__/text-input.stories.tsx":
    primitivesTextInput,
  "ui/primitives/graphics/__stories__/app-mark.stories.tsx": primitivesAppMark,
  "ui/primitives/graphics/__stories__/icon.stories.tsx": primitivesIcon,
  "ui/primitives/graphics/__stories__/spinner.stories.tsx": primitivesSpinner,
  "ui/primitives/navigation/__stories__/link.stories.tsx": primitivesLink,
  "ui/primitives/navigation/__stories__/nav-drawer.stories.tsx":
    primitivesNavDrawer,
  "ui/primitives/navigation/__stories__/nav-item.stories.tsx":
    primitivesNavItem,
  "ui/primitives/overlays/__stories__/dialog.stories.tsx": primitivesDialog,
  "ui/primitives/overlays/__stories__/toast.stories.tsx": primitivesToast,
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

  test("Toast の Stacked は、開いた時点で3つの知らせが見える", async () => {
    const { Stacked } = composeStories(primitivesToast);

    render(<Stacked />);
    await screen.findByText("本文を保存しました。");

    expect(screen.getAllByRole("alert")).toHaveLength(3);
  });

  test.each(STORIES)(
    "$file の $name を、誤りを出さずに描ける",
    async ({ Story }) => {
      const errors = spyOn(console, "error");

      try {
        const { container } = render(<Story />);

        await act(async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 50);
          });
        });

        expect(container.childElementCount).toBeGreaterThan(0);
        expect(errors).not.toHaveBeenCalled();
      } finally {
        errors.mockRestore();
      }
    },
  );
});
