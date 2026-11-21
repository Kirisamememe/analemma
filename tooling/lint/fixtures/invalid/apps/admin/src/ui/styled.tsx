const variables = { "--progress": 0.5 };
const padded = "p-4";
const props = { className: "p-4" };

/** 部品の style と className に、検査できない形を書く。 */
export const Styled = () => (
  <>
    <span style={{ color: "red" }} />
    <span style={variables} />
    <span className={padded} />
    <span className={() => "p-4"} />
    <span {...props} />
  </>
);
