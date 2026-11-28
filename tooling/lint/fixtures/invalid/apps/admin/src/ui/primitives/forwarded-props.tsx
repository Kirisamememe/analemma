import { shared } from "./shared-props";

type Props = {
  /** 外から参照する ID。 */
  id: string;
  /** 見た目の class。 */
  className: string;
};

const useField = () => ({ fieldProps: { id: "field" } });

/** 中身を検査できない props を、そのまま渡す部品。 */
export const ForwardedProps = (props: Props) => {
  const { id, ...rest } = props;
  const { fieldProps } = useField();
  let loose = { id };

  loose = { id: "other" };

  return (
    <>
      <span {...props} />
      <span {...rest} />
      <span {...shared} />
      <span {...fieldProps} />
      <span {...loose} />
    </>
  );
};
