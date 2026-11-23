import { toFixedPageContent } from "../../logic/to-fixed-page-content";
import {
  type EditorBase,
  type EditorValues,
  restoreContent,
} from "./flat-content";

/** フォームの値から、保存で送る入力と、送った時点の中身のフォームを作る。 */
export const toSaveInput = (
  { fields, unknownKeys }: EditorBase,
  values: EditorValues,
) => {
  const submitted = restoreContent(fields, { ...values, unknownKeys });

  return {
    submitted,
    input: {
      slug: values.slug,
      title: values.title,
      content: toFixedPageContent(fields, submitted),
    },
  };
};

/** 比べるフォームの値。 */
type Comparison = {
  /** 開いたときか、最後に保存できたときの値。 */
  readonly saved: EditorValues;
  /** 今の値。 */
  readonly current: EditorValues;
};

/** 保存した値と今の値とで、保存で送る slug・タイトル・中身が違うか。 */
export const hasUnsavedChanges = (
  base: EditorBase,
  { saved, current }: Comparison,
): boolean =>
  JSON.stringify(toSaveInput(base, saved).input) !==
  JSON.stringify(toSaveInput(base, current).input);
