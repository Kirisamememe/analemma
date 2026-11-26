import {
  createTV,
  createTwMerge,
  type TWMergeConfig,
} from "tailwind-variants/config";

const SCALE = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"];

const MERGE_CONFIG: TWMergeConfig = {
  extend: {
    theme: {
      blur: ["media"],
      color: [
        "canvas",
        "surface",
        "surface-sunken",
        "surface-muted",
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
      spacing: ["panel"],
      radius: ["xs", "control", "surface"],
      shadow: ["control", "overlay"],
      container: ["sm", "md", "lg", "form", "page"],
      ease: ["standard", "exit"],
      animate: ["spin", "pulse"],
    },
    classGroups: {
      h: ["h-control", "h-control-sm", "h-nav-bar", "h-photo-preview"],
      "bg-image": ["photo-caption-background"],
      "max-h": ["max-h-field-photo", "max-h-viewer-photo"],
      "min-h": ["min-h-nav-bar"],
      top: ["top-toast"],
      size: [
        "size-icon-xs",
        "size-icon-sm",
        "size-icon",
        "size-icon-lg",
        "size-icon-xl",
        "size-control",
      ],
      w: ["w-sidebar"],
      "object-position": ["object-focal"],
      z: [{ z: ["sticky", "overlay", "toast"] }],
      "grid-cols": [{ "grid-cols": ["thumbnails"] }],
      aspect: [{ aspect: ["photo"] }],
      delay: ["loading-delay"],
      duration: [{ duration: ["fast", "normal"] }],
      translate: ["state-pressed"],
      "focus-ring": ["focus-ring", "focus-ring-inset", "focus-ring-current"],
      "color-scheme": ["scheme-dark", "scheme-light", "scheme-inverse"],
    },
  },
};

/** デザインシステムの名前を入れた、class を merge する関数。 */
export const merge = createTwMerge(MERGE_CONFIG);

/** デザインシステムの名前を入れた merge を使う、tailwind-variants の `tv`。 */
export const tv = createTV({ twMergeConfig: MERGE_CONFIG });
