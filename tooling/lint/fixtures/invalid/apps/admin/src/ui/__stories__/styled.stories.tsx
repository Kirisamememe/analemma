/** story は、部品の中にあっても画面のコードと同じ決まりで書く。 */
export const Styled = () => (
  <div className="flex gap-2">
    <span className="min-w-0 truncate" />
    <span style={{ color: "red" }} />
  </div>
);
