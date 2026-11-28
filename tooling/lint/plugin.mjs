import noLintSuppression from "./rules/comments/no-lint-suppression.mjs";
import noStandaloneComment from "./rules/comments/no-standalone-comment.mjs";
import tsdocRoleOnly from "./rules/comments/tsdoc-role-only.mjs";
import noCatchOutsideEntry from "./rules/errors/no-catch-outside-entry.mjs";
import adminModuleLocation from "./rules/modules/admin-module-location.mjs";
import fileLengthLimit from "./rules/modules/file-length-limit.mjs";
import maxExportedFunctions from "./rules/modules/max-exported-functions.mjs";
import noCrossWorkspaceImport from "./rules/modules/no-cross-workspace-import.mjs";
import noDynamicImport from "./rules/modules/no-dynamic-import.mjs";
import noInlineParameterType from "./rules/modules/no-inline-parameter-type.mjs";
import requireJsxInTsx from "./rules/modules/require-jsx-in-tsx.mjs";
import noEffectOutsideAllowedHook from "./rules/react/no-effect-outside-allowed-hook.mjs";
import noJsxLogic from "./rules/react/no-jsx-logic.mjs";
import noReactInLogic from "./rules/react/no-react-in-logic.mjs";
import maxClassesPerString from "./rules/styles/max-classes-per-string.mjs";
import stylingBoundary from "./rules/styles/styling-boundary.mjs";
import noFocusedTest from "./rules/tests/no-focused-test.mjs";
import noMarkupTest from "./rules/tests/no-markup-test.mjs";
import requireSiblingTest from "./rules/tests/require-sibling-test.mjs";
import testLocation from "./rules/tests/test-location.mjs";

const plugin = {
  meta: {
    name: "project",
  },
  rules: {
    "admin-module-location": adminModuleLocation,
    "file-length-limit": fileLengthLimit,
    "max-classes-per-string": maxClassesPerString,
    "max-code-lines": fileLengthLimit,
    "max-exported-functions": maxExportedFunctions,
    "no-catch-outside-entry": noCatchOutsideEntry,
    "no-cross-workspace-import": noCrossWorkspaceImport,
    "no-dynamic-import": noDynamicImport,
    "no-effect-outside-allowed-hook": noEffectOutsideAllowedHook,
    "no-focused-test": noFocusedTest,
    "no-inline-parameter-type": noInlineParameterType,
    "no-jsx-logic": noJsxLogic,
    "no-lint-suppression": noLintSuppression,
    "no-markup-test": noMarkupTest,
    "no-react-in-logic": noReactInLogic,
    "no-standalone-comment": noStandaloneComment,
    "require-jsx-in-tsx": requireJsxInTsx,
    "require-sibling-test": requireSiblingTest,
    "styling-boundary": stylingBoundary,
    "test-location": testLocation,
    "tsdoc-role-only": tsdocRoleOnly,
  },
};

export default plugin;
