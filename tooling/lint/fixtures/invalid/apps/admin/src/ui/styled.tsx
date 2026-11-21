const variables = { "--progress": 0.5 };

/** 部品の style に、CSS 変数でないものを書く。 */
export const Styled = () => (
  <>
    <span style={{ color: "red" }} />
    <span style={variables} />
  </>
);
