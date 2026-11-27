import { useId, type ReactNode } from "react";

import { Branch } from "./branch";
import { GroupMarker } from "./group-marker";

import { Text } from "@/ui/layout";
import { tv } from "@/ui/tv";
import { typography } from "@/ui/typography";

const group = tv({
  base: "self-center wrap-anywhere",
  variants: { invalid: { true: "text-danger" } },
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

  const title = (
    <span
      id={titleId}
      className={group({
        invalid,
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
            <GroupMarker
              kind={kind}
              inGroup={props.inGroup === true}
              invalid={invalid}
            />
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
