import { useId, type ReactNode } from "react";

import { Text } from "@/ui/layout";
import { Icon } from "@/ui/primitives/graphics";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const branch = tv({
  base: "relative",
  variants: { add: { true: "flex ps-3" } },
});

const gapLine = tv({
  base: "relative -inset-s-4.75 block w-0 border-s-2",
  variants: {
    parent: { group: "h-4", repeat: "h-6" },
  },
});

const headingLead = tv({
  base: "grow",
  variants: {
    connected: { true: "relative -inset-s-4.75 self-start border-s-2" },
  },
});

const elbow = tv({
  base: "absolute -inset-s-4.75 top-0 w-4.75 rounded-es-control border-s-2 border-b-2",
  variants: {
    target: {
      heading: "h-3.75",
      item: "h-5.25",
      add: "h-4.25 w-7.75",
    },
  },
});

type BranchProps = {
  /** 線を引く親のまとまり。 */
  parent: "group" | "repeat";
  /** 枝をつなぐ先。 */
  target?: "heading" | "item" | "add" | undefined;
  /** 親の最後の子か。 */
  isLast?: boolean;
  /** 線の横に置く中身。 */
  children: ReactNode;
};

/** 中身の一区間を通る線と、見出しや追加ボタンへの枝。 */
export const Branch = ({
  parent,
  target,
  isLast = false,
  children,
}: BranchProps): ReactNode => (
  <div>
    <span aria-hidden="true" className={gapLine({ parent })} />
    <div className={branch({ add: target === "add" })}>
      {(!isLast || target === undefined) && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 -inset-s-4.75 border-s-2"
        />
      )}
      {target !== undefined && target !== "heading" && (
        <span aria-hidden="true" className={elbow({ target })} />
      )}
      {children}
    </div>
  </div>
);

const group = tv({
  slots: {
    marker: [
      "grid size-7 shrink-0 place-items-center rounded-full",
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
    "flex h-10 items-center gap-2 ps-3 pe-1",
    "rounded-control bg-surface-muted",
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
        className: typography({ role: kind === "item" ? "label" : "section" }),
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
      className="min-w-0 outline-hidden focus-visible:focus-ring"
      data-invalid={invalid || undefined}
      tabIndex={-1}
    >
      {kind === "item" ? (
        <>
          <div className={bar()}>
            {title}
            <div className="ms-auto flex gap-1">{props.actions}</div>
          </div>
          <div className="flex flex-col gap-4 ps-3 pt-4">
            {message}
            {children}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-stretch gap-1">
            <div
              aria-hidden="true"
              className="flex shrink-0 flex-col items-center"
            >
              <span className={headingLead({ connected: props.inGroup })} />
              <div className="relative">
                {props.inGroup === true && (
                  <span className={elbow({ target: "heading" })} />
                )}
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
          <div className="flex gap-1">
            <span aria-hidden="true" className="w-7 shrink-0" />
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
