import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { readdir } from "node:fs/promises";
import type { ComponentType } from "react";

import preview from "../../.storybook/preview";
import { findFieldGuidesWithPeriods } from "../../test-setup/field-guide";

import * as componentsPasskeyNameField from "@/components/__stories__/passkey-name-field.stories";
import * as componentsQueryContent from "@/components/__stories__/query-content.stories";
import * as componentsFormFields from "@/components/forms/__stories__/form-fields.stories";
import * as componentsForm from "@/components/forms/__stories__/form.stories";
import * as componentsSubmitting from "@/components/forms/__stories__/submitting.stories";
import * as featuresDeployTokensCopyButton from "@/features/deploy-tokens/ui/__stories__/copy-button.stories";
import * as featuresDeployTokensTokenValue from "@/features/deploy-tokens/ui/__stories__/token-value.stories";
import * as kindRefreshNotice from "@/features/fixed-pages/list/__stories__/kind-refresh-notice.stories";
import * as featuresFixedPagesContentGroup from "@/features/fixed-pages/ui/__stories__/content-group.stories";
import * as fixedPageKindGuide from "@/features/fixed-pages/ui/__stories__/kind-guide.stories";
import * as featuresImagesImageDetail from "@/features/images/detail/__stories__/image-detail.stories";
import * as featuresImagesSection from "@/features/images/list/__stories__/images-section.stories";
import * as featuresImagesImageRows from "@/features/images/ui/__stories__/image-rows.stories";
import * as featuresImagesImageViewer from "@/features/images/ui/__stories__/image-viewer.stories";
import * as featuresImagesInfoList from "@/features/images/ui/__stories__/info-list.stories";
import * as featuresImagesPhotoCarousel from "@/features/images/ui/upload/__stories__/photo-carousel.stories";
import * as UploadFileInputStories from "@/features/images/upload/__stories__/upload-file-input.stories";
import * as uploadLeaveDialog from "@/features/images/upload/__stories__/upload-leave-dialog.stories";
import * as uploadPhotoFields from "@/features/images/upload/__stories__/upload-photo-fields.stories";
import * as UploadPhotoStatusStories from "@/features/images/upload/__stories__/upload-photo-status.stories";
import * as routesSecurityPage from "@/routes/__stories__/security-page.stories";
import * as routesEnrollPage from "@/routes/auth/__stories__/enroll-page.stories";
import * as routesLoginPage from "@/routes/auth/__stories__/login-page.stories";
import * as routesDeployTokensPage from "@/routes/deploy-tokens/__stories__/deploy-tokens-page.stories";
import * as routesFixedPageEditor from "@/routes/fixed-pages/__stories__/fixed-page-editor.stories";
import * as routesFixedPagesPage from "@/routes/fixed-pages/__stories__/fixed-pages-page.stories";
import * as routesImageViewerPage from "@/routes/images/__stories__/image-viewer-page.stories";
import * as routesImagesPage from "@/routes/images/__stories__/images-page.stories";
import * as layoutAppShell from "@/ui/layout/__stories__/app-shell.stories";
import * as layoutCenter from "@/ui/layout/__stories__/center.stories";
import * as layoutCluster from "@/ui/layout/__stories__/cluster.stories";
import * as layoutHeading from "@/ui/layout/__stories__/heading.stories";
import * as layoutPageTransition from "@/ui/layout/__stories__/page-transition.stories";
import * as layoutStack from "@/ui/layout/__stories__/stack.stories";
import * as layoutText from "@/ui/layout/__stories__/text.stories";
import * as patternsEmptyState from "@/ui/patterns/__stories__/empty-state.stories";
import * as patternsErrorState from "@/ui/patterns/__stories__/error-state.stories";
import * as patternsLoadingState from "@/ui/patterns/__stories__/loading-state.stories";
import * as patternsPageHeader from "@/ui/patterns/__stories__/page-header.stories";
import * as patternsProgressList from "@/ui/patterns/__stories__/progress-list.stories";
import * as patternsSideNav from "@/ui/patterns/__stories__/side-nav.stories";
import * as primitivesBadge from "@/ui/primitives/__stories__/badge.stories";
import * as primitivesButton from "@/ui/primitives/__stories__/button.stories";
import * as primitivesForm from "@/ui/primitives/__stories__/form.stories";
import * as primitivesNotice from "@/ui/primitives/__stories__/notice.stories";
import * as collectionsActionList from "@/ui/primitives/collections/__stories__/action-list.stories";
import * as primitivesReorderableList from "@/ui/primitives/collections/__stories__/reorderable-list.stories";
import * as primitivesNumberField from "@/ui/primitives/form-fields/__stories__/number-field.stories";
import * as primitivesTextArea from "@/ui/primitives/form-fields/__stories__/text-area.stories";
import * as primitivesTextField from "@/ui/primitives/form-fields/__stories__/text-field.stories";
import * as primitivesTextInput from "@/ui/primitives/form-fields/__stories__/text-input.stories";
import * as primitivesCheckbox from "@/ui/primitives/form-fields/choices/__stories__/checkbox.stories";
import * as primitivesSelect from "@/ui/primitives/form-fields/choices/__stories__/select.stories";
import * as primitivesDateField from "@/ui/primitives/form-fields/date/__stories__/date-field.stories";
import * as primitivesAppMark from "@/ui/primitives/graphics/__stories__/app-mark.stories";
import * as primitivesIcon from "@/ui/primitives/graphics/__stories__/icon.stories";
import * as primitivesSkeleton from "@/ui/primitives/graphics/__stories__/skeleton.stories";
import * as primitivesSpinner from "@/ui/primitives/graphics/__stories__/spinner.stories";
import * as primitivesLink from "@/ui/primitives/navigation/__stories__/link.stories";
import * as primitivesNavDrawer from "@/ui/primitives/navigation/__stories__/nav-drawer.stories";
import * as primitivesNavItem from "@/ui/primitives/navigation/__stories__/nav-item.stories";
import * as primitivesNavSelect from "@/ui/primitives/navigation/__stories__/nav-select.stories";
import * as primitivesNavigationProgress from "@/ui/primitives/navigation/__stories__/navigation-progress.stories";
import * as primitivesScrollView from "@/ui/primitives/navigation/__stories__/scroll-view.stories";
import * as primitivesDialog from "@/ui/primitives/overlays/__stories__/dialog.stories";
import * as primitivesFocusScope from "@/ui/primitives/overlays/__stories__/focus-scope.stories";
import * as primitivesOverlayLayer from "@/ui/primitives/overlays/__stories__/overlay-layer.stories";
import * as primitivesToast from "@/ui/primitives/overlays/__stories__/toast.stories";
import * as specimensColors from "@/ui/specimens/__stories__/colors.stories";
import * as specimensTypography from "@/ui/specimens/__stories__/typography.stories";

const MODULES = {
  "ui/primitives/navigation/__stories__/scroll-view.stories.tsx":
    primitivesScrollView,
  "components/forms/__stories__/form.stories.tsx": componentsForm,
  "components/forms/__stories__/form-fields.stories.tsx": componentsFormFields,
  "components/forms/__stories__/submitting.stories.tsx": componentsSubmitting,
  "components/__stories__/query-content.stories.tsx": componentsQueryContent,
  "components/__stories__/passkey-name-field.stories.ts":
    componentsPasskeyNameField,
  "features/deploy-tokens/ui/__stories__/copy-button.stories.ts":
    featuresDeployTokensCopyButton,
  "features/deploy-tokens/ui/__stories__/token-value.stories.ts":
    featuresDeployTokensTokenValue,
  "features/fixed-pages/list/__stories__/kind-refresh-notice.stories.ts":
    kindRefreshNotice,
  "features/fixed-pages/ui/__stories__/content-group.stories.tsx":
    featuresFixedPagesContentGroup,
  "features/images/upload/__stories__/upload-photo-fields.stories.tsx":
    uploadPhotoFields,
  "features/images/upload/__stories__/upload-leave-dialog.stories.tsx":
    uploadLeaveDialog,
  "features/images/detail/__stories__/image-detail.stories.tsx":
    featuresImagesImageDetail,
  "features/images/list/__stories__/images-section.stories.tsx":
    featuresImagesSection,
  "features/images/ui/upload/__stories__/photo-carousel.stories.tsx":
    featuresImagesPhotoCarousel,
  "features/images/ui/__stories__/image-rows.stories.tsx":
    featuresImagesImageRows,
  "features/images/ui/__stories__/image-viewer.stories.tsx":
    featuresImagesImageViewer,
  "features/images/ui/__stories__/info-list.stories.ts": featuresImagesInfoList,
  "features/images/upload/__stories__/upload-file-input.stories.ts":
    UploadFileInputStories,
  "features/images/upload/__stories__/upload-photo-status.stories.ts":
    UploadPhotoStatusStories,
  "routes/auth/__stories__/enroll-page.stories.ts": routesEnrollPage,
  "routes/auth/__stories__/login-page.stories.ts": routesLoginPage,
  "routes/__stories__/security-page.stories.ts": routesSecurityPage,
  "routes/deploy-tokens/__stories__/deploy-tokens-page.stories.ts":
    routesDeployTokensPage,
  "routes/fixed-pages/__stories__/fixed-page-editor.stories.ts":
    routesFixedPageEditor,
  "routes/fixed-pages/__stories__/fixed-pages-page.stories.ts":
    routesFixedPagesPage,
  "routes/images/__stories__/image-viewer-page.stories.ts":
    routesImageViewerPage,
  "routes/images/__stories__/images-page.stories.ts": routesImagesPage,
  "ui/layout/__stories__/app-shell.stories.tsx": layoutAppShell,
  "ui/layout/__stories__/center.stories.tsx": layoutCenter,
  "ui/layout/__stories__/cluster.stories.tsx": layoutCluster,
  "ui/layout/__stories__/heading.stories.ts": layoutHeading,
  "ui/layout/__stories__/page-transition.stories.tsx": layoutPageTransition,
  "features/fixed-pages/ui/__stories__/kind-guide.stories.ts":
    fixedPageKindGuide,
  "ui/primitives/collections/__stories__/action-list.stories.tsx":
    collectionsActionList,
  "ui/layout/__stories__/stack.stories.tsx": layoutStack,
  "ui/layout/__stories__/text.stories.ts": layoutText,
  "ui/patterns/__stories__/empty-state.stories.tsx": patternsEmptyState,
  "ui/patterns/__stories__/error-state.stories.tsx": patternsErrorState,
  "ui/patterns/__stories__/loading-state.stories.ts": patternsLoadingState,
  "ui/patterns/__stories__/page-header.stories.tsx": patternsPageHeader,
  "ui/patterns/__stories__/progress-list.stories.tsx": patternsProgressList,
  "ui/patterns/__stories__/side-nav.stories.tsx": patternsSideNav,
  "ui/primitives/__stories__/badge.stories.ts": primitivesBadge,
  "ui/primitives/__stories__/button.stories.tsx": primitivesButton,
  "ui/primitives/__stories__/form.stories.tsx": primitivesForm,
  "ui/primitives/__stories__/notice.stories.ts": primitivesNotice,
  "ui/primitives/collections/__stories__/reorderable-list.stories.tsx":
    primitivesReorderableList,
  "ui/primitives/form-fields/choices/__stories__/checkbox.stories.tsx":
    primitivesCheckbox,
  "ui/primitives/form-fields/choices/__stories__/select.stories.tsx":
    primitivesSelect,
  "ui/primitives/form-fields/date/__stories__/date-field.stories.tsx":
    primitivesDateField,
  "ui/primitives/form-fields/__stories__/number-field.stories.tsx":
    primitivesNumberField,
  "ui/primitives/form-fields/__stories__/text-area.stories.tsx":
    primitivesTextArea,
  "ui/primitives/form-fields/__stories__/text-field.stories.ts":
    primitivesTextField,
  "ui/primitives/form-fields/__stories__/text-input.stories.ts":
    primitivesTextInput,
  "ui/primitives/graphics/__stories__/app-mark.stories.ts": primitivesAppMark,
  "ui/primitives/graphics/__stories__/icon.stories.tsx": primitivesIcon,
  "ui/primitives/graphics/__stories__/skeleton.stories.ts": primitivesSkeleton,
  "ui/primitives/graphics/__stories__/spinner.stories.ts": primitivesSpinner,
  "ui/primitives/navigation/__stories__/link.stories.ts": primitivesLink,
  "ui/primitives/navigation/__stories__/nav-drawer.stories.tsx":
    primitivesNavDrawer,
  "ui/primitives/navigation/__stories__/nav-item.stories.tsx":
    primitivesNavItem,
  "ui/primitives/navigation/__stories__/nav-select.stories.tsx":
    primitivesNavSelect,
  "ui/primitives/navigation/__stories__/navigation-progress.stories.ts":
    primitivesNavigationProgress,
  "ui/primitives/overlays/__stories__/dialog.stories.tsx": primitivesDialog,
  "ui/primitives/overlays/__stories__/focus-scope.stories.tsx":
    primitivesFocusScope,
  "ui/primitives/overlays/__stories__/overlay-layer.stories.tsx":
    primitivesOverlayLayer,
  "ui/primitives/overlays/__stories__/toast.stories.tsx": primitivesToast,
  "ui/specimens/__stories__/colors.stories.ts": specimensColors,
  "ui/specimens/__stories__/typography.stories.ts": specimensTypography,
};

const STORY_FILE = /(?:^|\/)__stories__\/[^\/]+\.stories\.tsx?$/v;

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

        expect(
          findFieldGuidesWithPeriods(
            document.body,
            document.documentElement.lang,
          ),
        ).toEqual([]);
        expect(container.childElementCount).toBeGreaterThan(0);
        expect(errors).not.toHaveBeenCalled();
      } finally {
        errors.mockRestore();
      }
    },
  );
});
