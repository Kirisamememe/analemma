/** Dialog の外枠と固定ヘッダーに個別の線を重ねた例。 */
export const Dialog = () => (
  <article className="rounded-surface border border-line">
    <header className="sticky top-0 after:border-b" />
    <footer className="divide-y divide-line" />
    <aside className="outline-2 outline-line" />
  </article>
);
