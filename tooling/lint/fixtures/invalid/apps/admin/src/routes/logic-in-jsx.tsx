type Props = {
  /** 見出し。 */
  title: string | undefined;
  /** 補足。 */
  note: string | undefined;
  /** 送っているか。 */
  isSaving: boolean;
  /** 押したときに呼ぶ関数。 */
  onPress: (count: number) => void;
};

/** JSX の中にロジックを書いた部品。 */
export const LogicInJsx = ({ title, note, isSaving, onPress }: Props) => (
  <section>
    {title !== undefined && title !== "" && <h2>{title}</h2>}
    {isSaving ? <p>saving</p> : <p>{note === undefined ? "none" : note}</p>}
    {isSaving && <div>{note !== undefined && <p>{note}</p>}</div>}
    <button
      type="button"
      onClick={() => {
        const first = 1;
        const second = 2;
        onPress(first + second);
      }}
    >
      press
    </button>
  </section>
);
