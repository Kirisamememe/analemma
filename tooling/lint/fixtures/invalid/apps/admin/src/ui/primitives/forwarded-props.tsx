import { useDrop, useOverlayPosition } from "react-aria";

import { shared } from "./shared-props";

type Props = {
  /** 外から参照する ID。 */
  id: string;
  /** 見た目の class。 */
  className: string;
  /** 条件。 */
  flag: boolean;
};

const useField = () => ({ fieldProps: { id: "field" } });
const key = "className";

/** 中身を検査できない props を、そのまま渡す部品。 */
export const ForwardedProps = (props: Props) => {
  const { id, flag, ...rest } = props;
  const { fieldProps } = useField();
  const { overlayProps } = useOverlayPosition({ targetRef: { current: null } });
  const { dropProps } = useDrop({ ref: { current: null } });
  const wrapped = { role: "group", ...props };
  const mutated: Record<string, string> = { id };
  let loose = { id };

  loose = { id: "other" };
  mutated.className = "p-4";
  Object.assign(dropProps, props);

  return (
    <>
      <span {...props} />
      <span {...rest} />
      <span {...shared} />
      <span {...fieldProps} />
      <span {...loose} />
      <span {...overlayProps} />
      <span {...dropProps} />
      <span {...wrapped} />
      <span {...mutated} />
      <span {...{ style: { color: "red" } }} />
      <span {...{ contentClassName: "p-4" }} />
      <span {...{ [key]: "p-4" }} />
      <span {...(flag ? {} : { className: "p-4" })} />
    </>
  );
};
