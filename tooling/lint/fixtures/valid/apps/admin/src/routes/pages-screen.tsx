const style = "currency";

/** 一覧の行の名前と値段。 */
export const PageName = () => (
  <span className="min-w-0 truncate">
    {new Intl.NumberFormat("ja", { style, currency: "JPY" }).format(1)}
  </span>
);
