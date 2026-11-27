const STATE_BORDER_COLORS = [
  "border-info",
  "border-success",
  "border-warning",
  "border-danger",
];

/** 部品ごとに許可する border と outline の class。 */
export const BORDER_CLASSES: Readonly<Record<string, readonly string[]>> = {
  "features/images/ui/upload/photo-drop-hint.tsx": ["drop-target"],
  "ui/primitives/form-fields/field-control.ts": [
    "border",
    "border-line-strong",
    "is-invalid:border-danger",
    "not-forced-colors:is-invalid:outline-danger",
  ],
  "ui/primitives/form-fields/choices/checkbox-control.tsx": [
    "border",
    "border-line-strong",
    "group-is-selected:border-primary",
    "group-is-invalid:border-danger",
    "not-forced-colors:group-is-invalid:outline-danger",
  ],
  "ui/primitives/form-fields/number/step-button.tsx": ["border-s"],
  "ui/primitives/button.tsx": [
    "border",
    "border-transparent",
    "border-dashed",
    "border-line-strong",
  ],
  "features/deploy-tokens/ui/token-value.tsx": ["border"],
  "ui/primitives/badge.tsx": [
    "border",
    "border-transparent",
    ...STATE_BORDER_COLORS,
  ],
  "ui/primitives/notice.tsx": ["border", ...STATE_BORDER_COLORS],
  "ui/patterns/photos/image-radio.tsx": [
    "border-2",
    "border-current",
    "forced-colors:outline",
  ],
  "ui/patterns/states/empty-state.tsx": ["border", "border-dashed"],
  "ui/patterns/states/error-state.tsx": ["border"],
  "features/fixed-pages/ui/group-marker.tsx": [
    "border-2",
    "border-s-2",
    "border-danger",
  ],
  "features/fixed-pages/ui/nest-line.tsx": ["border-s-2", "border-b-2"],
  "ui/primitives/graphics/spinner.tsx": [
    "border-2",
    "border-current",
    "border-t-transparent",
  ],
  "ui/primitives/overlays/toast/toast.tsx": ["border", "border-transparent"],
  "ui/primitives/navigation/scroll/scroll-view.tsx": [
    "forced-colors:after:border-2",
  ],
  "ui/primitives/collections/reorderable-list.tsx": [
    "after:outline",
    "after:outline-fg/10",
    "forced-colors:after:outline-line",
    "is-dragging:after:outline-fg/40",
    "is-dragging:after:outline-dashed",
  ],
  "ui/primitives/navigation/nav-item-style.ts": [
    "after:outline",
    "after:outline-fg/10",
    "forced-colors:after:outline-line",
    "is-hovered:after:outline-fg/20",
  ],
  "features/images/ui/viewer-styles.ts": [
    "outline",
    "outline-fg/20",
    "group-focus-visible:outline-2",
    "group-focus-visible:-outline-offset-2",
    "group-focus-visible:outline-current",
  ],
  "ui/specimens/color-specimen.tsx": [
    "outline",
    "-outline-offset-1",
    "outline-fg/10",
  ],
};

/** 枠を描く class を、用途の決まった部品と状態に限る検査。 */
export const borderRestriction = (allowed: readonly string[] = []) => ({
  pattern: `^(?!(?:${allowed.join("|")})$)(?:[^:]+:)*(?:border(?!(?:-spacing(?:-|$)|-collapse$|-separate$))|divide|drop-target|-?outline(?!-hidden$|-none$))(?:-|$)`,
  message:
    "線は、写真や色の面と色が喧嘩しないように描きます。領域の区切りは separator-t・separator-b・separator-s・separator-e、浮いた面の縁は edge-outer を使います。border と outline の class を書けるのは、許可した部品だけです(apps/admin/src/ui/DECISIONS.md の「枠と面の境界」)。",
});
