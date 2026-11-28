import { useDrop } from "react-aria";

type Props = {
  /** 外から参照する ID。 */
  id?: string | undefined;
  /** 読み上げる名前。 */
  label?: string | undefined;
};

/** 未指定の props を省いて渡す部品。 */
export const PlainSpread = ({ id, label }: Props) => {
  const { dropProps } = useDrop({ ref: { current: null } });

  const named = {
    role: "group",
    ...(label === undefined ? {} : { "aria-label": label }),
  };

  return (
    <div {...dropProps} {...named} {...(id === undefined ? {} : { id })} />
  );
};
