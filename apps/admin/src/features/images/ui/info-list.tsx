import type { ReactNode } from "react";

import { Text } from "@/ui/layout";
import { tv } from "@/ui/tv";

const infoList = tv({
  slots: {
    list: "flex flex-col",
    item: "flex",
    term: "text-fg-muted",
    value: "min-w-0 wrap-anywhere whitespace-pre-line",
  },
  variants: {
    layout: {
      stacked: { list: "gap-4", item: "flex-col gap-1" },
      columns: { list: "gap-2", item: "gap-4", term: "w-28 shrink-0" },
    },
  },
});

/** 情報の1項目。 */
export type InfoItem = {
  /** 項目の名前。 */
  readonly label: string;
  /** 値。 */
  readonly value: string;
};

/** 情報の一覧に渡す値。 */
type InfoListProps = {
  /** 並べる項目。 */
  items: readonly InfoItem[];
  /** 並べ方(名前の下に値を置くか、名前と値を横に並べるか)。 */
  layout: "stacked" | "columns";
};

/** 項目の名前と値を並べる一覧。 */
export const InfoList = ({ items, layout }: InfoListProps): ReactNode => {
  const style = infoList({ layout });
  return (
    <dl className={style.list()}>
      {items.map(({ label, value: text }) => (
        <div className={style.item()} key={label}>
          <dt className={style.term()}>
            <Text as="span" variant={layout === "stacked" ? "caption" : "body"}>
              {label}
            </Text>
          </dt>
          <dd className={style.value()}>
            <Text
              as="span"
              variant={layout === "stacked" ? "body-long" : "body"}
            >
              {text}
            </Text>
          </dd>
        </div>
      ))}
    </dl>
  );
};
