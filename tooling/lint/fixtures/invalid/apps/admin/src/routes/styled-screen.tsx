const wide = "grow";

/** 画面のコードで見た目を書く。 */
export const StyledScreen = () => (
  <div className="flex gap-2">
    <span className={wide}>名前</span>
    <span style={{ color: "red" }}>説明</span>
    <span {...{ className: "flex" }}>値</span>
  </div>
);
