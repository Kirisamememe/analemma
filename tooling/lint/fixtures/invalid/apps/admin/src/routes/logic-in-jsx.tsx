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
    {title !== undefined && title !== "" && title}
    {isSaving && !title ? <p>{note}</p> : <p>{title}</p>}
    {isSaving ? <p>{title}</p> : <p>{note === undefined ? title : note}</p>}
    {isSaving && <div>{note !== undefined && <p>{note}</p>}</div>}
    {isSaving && <div>{note !== undefined && note}</div>}
    {isSaving ? title : note !== undefined && note}
    <button
      type="button"
      onClick={() => {
        const first = 1;
        const second = 2;
        onPress(first + second);
      }}
    >
      {title}
    </button>
    <button
      type="button"
      onClick={() => {
        if (isSaving) {
          onPress(1);
          onPress(2);
        }
      }}
    >
      {note}
    </button>
    <p {...(isSaving && note !== undefined && title ? { title } : {})} />
  </section>
);
