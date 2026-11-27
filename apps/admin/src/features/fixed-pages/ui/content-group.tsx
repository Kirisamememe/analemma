import { useId, type ReactNode } from "react";

import { Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const PARENT_COLUMN = [
  "-inset-s-4.75",
  "@max-3xs/nested-form:-inset-s-nested-branch",
]; // 親の丸の中心を通る列

const ELBOW = [
  "absolute top-0 w-4.75 rounded-es-control border-s-2 border-b-2",
  "@max-3xs/nested-form:w-nested-branch",
];

const nestLine = tv({
  base: PARENT_COLUMN,
  variants: {
    shape: {
      gapUnderGroup: "relative block h-4 w-0 border-s-2",
      gapUnderRepeat: "relative block h-6 w-0 border-s-2",
      through: "absolute inset-y-0 border-s-2",
      lead: "relative grow self-start border-s-2",
      elbowToHeading: [
        ...ELBOW,
        "h-3.75 @max-3xs/nested-form:h-nested-heading",
      ],
      elbowToItem: [...ELBOW, "h-5.25 @max-3xs/nested-form:h-nested-item"],
      elbowToAdd: [
        "absolute top-0 h-1/2 w-7.75",
        "@max-3xs/nested-form:w-nested-add",
      ],
    },
  },
});

type NestLineProps = {
  /** 線の形。 */
  shape:
    | "gapUnderGroup"
    | "gapUnderRepeat"
    | "through"
    | "lead"
    | "elbowToHeading"
    | "elbowToItem"
    | "elbowToAdd";
};

/** 入れ子のまとまりの、親の列を通る線と、子へつなぐ枝。 */
const NestLine = ({ shape }: NestLineProps): ReactNode => (
  <span aria-hidden="true" className={nestLine({ shape })}>
    {shape === "elbowToAdd" && (
      <span className="absolute inset-x-0 top-0 -bottom-px rounded-es-control border-s-2 border-b-2" />
    )}
  </span>
);

const branch = tv({
  base: "relative",
  variants: { add: { true: "flex ps-3 @max-3xs/nested-form:ps-1" } },
});

type BranchProps = {
  /** 線を引く親のまとまり。 */
  parent: "group" | "repeat";
  /** 枝をつなぐ先。 */
  target?: "heading" | "item" | "add" | undefined;
  /** 親の最後の子か。 */
  isLast?: boolean;
  /** 追加のボタンの下に出して、読み上げにも知らせる補足。 */
  note?: string | undefined;
  /** 線の横に置く中身。 */
  children: ReactNode;
};

/** 中身の一区間を通る線と、見出しや追加ボタンへの枝。 */
export const Branch = ({
  parent,
  target,
  isLast = false,
  note,
  children,
}: BranchProps): ReactNode => (
  <div>
    <NestLine shape={parent === "group" ? "gapUnderGroup" : "gapUnderRepeat"} />
    <div className={branch({ add: target === "add" })}>
      {(!isLast || target === undefined) && <NestLine shape="through" />}
      {target === "item" && <NestLine shape="elbowToItem" />}
      {target === "add" && <NestLine shape="elbowToAdd" />}
      {children}
    </div>
    {target === "add" && (
      <output className="block">
        {note !== undefined && (
          <span className="block ps-3 pt-1.5 @max-3xs/nested-form:ps-1">
            <Text as="span" tone="muted" variant="caption">
              {note}
            </Text>
          </span>
        )}
      </output>
    )}
  </div>
);

const group = tv({
  slots: {
    marker: [
      "grid size-7 shrink-0 place-items-center rounded-full @max-3xs/nested-form:size-5",
      "border-2 bg-surface text-fg-muted",
    ],
    title: "self-center wrap-anywhere",
  },
  variants: {
    invalid: {
      true: { marker: "border-danger text-danger", title: "text-danger" },
    },
  },
});

const bar = tv({
  base: [
    "flex min-h-10 flex-wrap items-start gap-2 py-1 ps-3 pe-1",
    "rounded-control bg-surface-muted",
    "@max-3xs/nested-form:gap-1 @max-3xs/nested-form:ps-1",
  ],
});

type ContentGroupProps = {
  /** 見出しの名前。 */
  label: string;
  /** まとまりに結び付いた誤り。 */
  error: string | undefined;
  /** まとまりの中身。 */
  children: ReactNode;
} & (
  | {
      /** 項目の型。 */
      kind: "group" | "repeat";
      /** 親の group から見出しに枝をつなぐか。 */
      inGroup?: boolean;
    }
  | {
      /** repeat の要素。 */
      kind: "item";
      /** 要素の帯に置く操作。 */
      actions: ReactNode;
    }
);

/** group・repeat・要素に、見出しの名前と誤りの説明を結び付ける。 */
export const ContentGroup = (props: ContentGroupProps): ReactNode => {
  const { label, error, kind, children } = props;
  const titleId = useId();
  const errorId = useId();
  const invalid = error !== undefined;
  const style = group({ invalid });

  const title = (
    <span
      id={titleId}
      className={style.title({
        className: typography({ role: "section" }),
      })}
    >
      {label}
    </span>
  );

  const message = invalid && (
    <div id={errorId} role="alert">
      <Text tone="danger" variant="caption">
        {error}
      </Text>
    </div>
  );

  return (
    <fieldset
      aria-describedby={invalid ? errorId : undefined}
      aria-labelledby={titleId}
      className="min-w-0 outline-hidden focus-visible:*:first:focus-ring"
      data-invalid={invalid || undefined}
      tabIndex={invalid ? -1 : undefined}
    >
      {kind === "item" ? (
        <>
          <div className={bar()}>
            <div className="self-start py-1.5" id={titleId}>
              <Text variant="label" tone={invalid ? "danger" : "default"}>
                {label}
              </Text>
            </div>
            <div className="ms-auto flex max-w-full flex-wrap justify-end gap-1">
              {props.actions}
            </div>
          </div>
          <div className="flex flex-col gap-4 ps-3 pt-4 @max-3xs/nested-form:ps-1">
            {message}
            {children}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-stretch gap-1 @max-3xs/nested-form:gap-0.5">
            <div
              aria-hidden="true"
              className="flex shrink-0 flex-col items-center"
            >
              {props.inGroup === true ? (
                <NestLine shape="lead" />
              ) : (
                <span className="grow" />
              )}
              <div className="relative">
                {props.inGroup === true && <NestLine shape="elbowToHeading" />}
                <span className={style.marker()}>
                  <Icon
                    name={kind === "group" ? "layers" : "list"}
                    size="md"
                    weight="bold"
                  />
                </span>
              </div>
              <span className="grow border-s-2" />
            </div>
            {title}
          </div>
          <div className="flex gap-1 @max-3xs/nested-form:gap-0.5">
            <span
              aria-hidden="true"
              className="w-7 shrink-0 @max-3xs/nested-form:w-3"
            />
            <div className="min-w-0 grow">
              {invalid && <Branch parent={kind}>{message}</Branch>}
              {children}
            </div>
          </div>
        </>
      )}
    </fieldset>
  );
};
