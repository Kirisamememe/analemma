type Props = {
  /** 見出し。 */
  title: string | undefined;
  /** 補足。 */
  note: string | undefined;
  /** 送っているか。 */
  isSaving: boolean;
  /** 送っている間に出す文言。 */
  saving: string;
  /** ボタンの文言。 */
  label: string;
  /** 押したときに呼ぶ関数。 */
  onPress: (count: number) => void;
};

const hasText = (text: string | undefined): text is string =>
  text !== undefined && text !== "";

/** ロジックを JSX の外に出した部品。 */
export const PlainJsx = (props: Props) => {
  const { title, note, isSaving, saving, label, onPress } = props;
  const noteLine = note !== undefined && <p>{note}</p>;

  const press = (): void => {
    const first = 1;
    const second = 2;
    onPress(first + second);
  };

  return (
    <section>
      {hasText(title) && <h2>{title}</h2>}
      {!isSaving && <p>{note ?? "none"}</p>}
      {saving.length === label.length - 1 ? <p>{saving}</p> : <p>{label}</p>}
      {isSaving ? <p>{saving}</p> : <div>{noteLine}</div>}
      <button
        type="button"
        onClick={() => {
          press();
          onPress(0);
        }}
      >
        {label}
      </button>
    </section>
  );
};
