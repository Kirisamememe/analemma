const STATE_BORDER_COLORS = [
  "border-info",
  "border-success",
  "border-warning",
  "border-danger",
];

/** 部品ごとに許可する border と outline の class。 */
export const BORDER_CLASSES: Readonly<Record<string, readonly string[]>> = {
  "ui/primitives/form-fields/field-control.ts": [
    "border",
    "border-line-strong",
    "is-invalid:border-danger",
    "not-forced-colors:is-invalid:outline-danger",
  ],
  "ui/primitives/form-fields/choices/checkbox-input.tsx": [
    "border",
    "border-line-strong",
    "group-is-selected:border-primary",
    "group-is-invalid:border-danger",
    "not-forced-colors:group-is-invalid:outline-danger",
  ],
  "ui/primitives/form-fields/number-field.tsx": ["border-s"],
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
  "ui/patterns/empty-state.tsx": ["border", "border-dashed"],
  "ui/patterns/error-state.tsx": ["border"],
  "features/fixed-pages/ui/content-group.tsx": [
    "border-2",
    "border-s-2",
    "border-b-2",
    "border-danger",
  ],
  "ui/primitives/graphics/spinner.tsx": [
    "border-2",
    "border-current",
    "border-t-transparent",
  ],
  "ui/primitives/overlays/toast.tsx": ["border", "border-transparent"],
  "ui/primitives/overlays/dialog.tsx": ["outline", "outline-fg/10"],
  "ui/primitives/overlays/list-box-popover.tsx": ["outline", "outline-fg/10"],
  "ui/primitives/navigation/nav-drawer.tsx": ["outline", "outline-fg/10"],
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
  "ui/patterns/side-nav.tsx": ["after:border-b"],
  "ui/layout/media-layout.ts": ["border-t", "md:border-t-0", "md:border-l"],
  "ui/layout/app-shell.tsx": ["md:outline", "md:outline-fg/10"],
  "features/images/ui/viewer-styles.ts": [
    "border-b",
    "outline",
    "outline-fg/20",
    "group-focus-visible:outline-2",
    "group-focus-visible:-outline-offset-2",
    "group-focus-visible:outline-current",
  ],
  "ui/specimens/story-stage.tsx": ["outline", "outline-fg/10"],
  "ui/specimens/color-specimen.tsx": [
    "outline",
    "-outline-offset-1",
    "outline-fg/10",
  ],
};

/** 枠を描く class を、用途の決まった部品と状態に限る検査。 */
export const borderRestriction = (allowed: readonly string[] = []) => ({
  pattern: `^(?!(?:${allowed.join("|")})$)(?:[^:]+:)*(?:border(?!(?:-spacing(?:-|$)|-collapse$|-separate$))|divide|-?outline(?!-hidden$|-none$))(?:-|$)`,
  message:
    "枠は用途を決めた共通部品で描きます。入力欄・Button の枠、Dialog の縁、focus-ring を使います。",
});
