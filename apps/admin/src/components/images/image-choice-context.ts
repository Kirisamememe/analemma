import { createContext } from "react";

import type { useImageSelection } from "./hooks/use-image-selection";

type Selection = ReturnType<typeof useImageSelection>;

/** Dialog が保持する選択元と入力欄のグループ。 */
export const SelectionSourceContext = createContext<Selection["source"] | null>(
  null,
);

/** 追加済み・削除済み・送信中の入力の扱い。 */
export const ChoiceConditionsContext = createContext<
  Selection["conditions"] | null
>(null);
