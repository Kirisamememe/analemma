import {
  createTV,
  createTwMerge,
  type TWMergeConfig,
} from "tailwind-variants/config";

const SCALE = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];

const MERGE_CONFIG: TWMergeConfig = {
  extend: {
    theme: {
      color: [
        "canvas",
        "surface",
        "surface-sunken",
        "fg",
        "fg-muted",
        "line",
        "line-strong",
        "focus",
        "primary",
        "on-primary",
        "danger-strong",
        "on-danger-strong",
        "info",
        "success",
        "warning",
        "danger",
        "on-info",
        "on-success",
        "on-warning",
        "on-danger",
        "scrim",
        "on-media",
      ],
      text: SCALE,
      leading: SCALE,
      radius: ["xs", "control", "surface"],
      shadow: ["control", "overlay"],
      container: ["sm", "md", "lg", "form", "page"],
      ease: ["standard", "exit"],
      animate: ["spin", "pulse"],
    },
    classGroups: {
      h: ["h-control", "h-control-sm"],
      size: ["size-icon", "size-control"],
      w: ["w-sidebar"],
      "object-position": ["object-focal"],
      z: [{ z: ["sticky", "overlay", "toast"] }],
      "grid-cols": [{ "grid-cols": ["thumbnails"] }],
      aspect: [{ aspect: ["photo"] }],
      duration: [{ duration: ["fast", "normal"] }],
      "interaction-state": ["state-hover", "state-pressed"],
      "focus-ring": ["focus-ring", "focus-ring-inset"],
      "color-scheme": ["scheme-dark", "scheme-light"],
    },
  },
};

/** デザインシステムの名前を入れた、class を merge する関数。 */
export const merge = createTwMerge(MERGE_CONFIG);

/** デザインシステムの名前を入れた merge を使う、tailwind-variants の `tv`。 */
export const tv = createTV({ twMergeConfig: MERGE_CONFIG });
