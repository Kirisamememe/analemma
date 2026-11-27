import type { ReactNode } from "react";

import type { FixedPageEditorProps } from "../hooks/use-editor-form";
import { DeleteFixedPage } from "./delete-fixed-page";

import { useTranslate } from "@/i18n/use-translate";
import { PageHeader } from "@/ui/patterns";

/** 編集画面の見出しに渡す値。 */
type EditorHeaderProps = {
  /** 編集する固定ページと種類。 */
  pageProps: FixedPageEditorProps;
  /** 削除の確認を開いたときと閉じたときに呼ぶ関数。 */
  onDeleteOpen: (open: boolean) => void;
  /** 保存のボタン。 */
  save: ReactNode;
};

/** 作成か編集かを示す見出しと、編集のときの削除と保存の操作。 */
export const EditorHeader = ({
  pageProps: props,
  onDeleteOpen,
  save,
}: EditorHeaderProps): ReactNode => {
  const t = useTranslate();

  return (
    <PageHeader
      actions={
        props.page !== undefined && (
          <>
            <DeleteFixedPage
              onDeleted={props.onDeleted}
              onOpenChange={onDeleteOpen}
              page={props.page}
            />
            {save}
          </>
        )
      }
      description={t("fixedPageEditor.kindOf", { kind: props.kind.label })}
      title={t(
        props.page === undefined
          ? "fixedPageEditor.new"
          : "fixedPageEditor.edit",
      )}
    />
  );
};
