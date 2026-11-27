import { useSearch } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { EditorFrame } from "./editor-frame";
import { KindPicker } from "./kind-picker";
import { NewPageEditor } from "./new-page-editor";
import { Titled } from "./titled";

import { KindGuide } from "@/features/fixed-pages/ui/kind-guide";

/** 種類を選んで固定ページを作る画面。 */
export const NewFixedPage = (): ReactNode => {
  const { t } = useTranslation();
  const { kind } = useSearch({ from: "/signed-in/fixed-pages/new" });
  const [picked, setPicked] = useState(false);

  return (
    <EditorFrame>
      {kind === undefined ? (
        <Titled
          description={t("fixedPageEditor.newDescription")}
          title={t("fixedPageEditor.new")}
        >
          <KindPicker
            onPick={() => {
              setPicked(true);
            }}
          />
          <KindGuide />
        </Titled>
      ) : (
        <NewPageEditor name={kind} picked={picked} />
      )}
    </EditorFrame>
  );
};
