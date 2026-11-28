import type { ComponentType, ReactNode } from "react";

/** 文言を props で受ける部品。 */
type LabelledProps = Record<string, string>;

/** 文言を受ける props に、訳を通さない文言を直接書いた画面。 */
export const LiteralLabels = ({
  Part,
}: Record<"Part", ComponentType<LabelledProps>>): ReactNode => (
  <Part
    closeLabel="閉じる"
    drawerCloseLabel="ナビを閉じる"
    drawerOpenLabel="ナビを開く"
    openLabel="ナビを開く"
    pendingLabel="処理中"
    requiredLabel="必須"
    toastCloseLabel="閉じる"
  />
);
