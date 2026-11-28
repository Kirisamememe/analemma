import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useKind } from "./hooks/use-kind";
import { Titled } from "./titled";

import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import { Stack } from "@/ui/layout";
import { ErrorState, LoadingState } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** 作成のフォームに渡す値。 */
type NewPageEditorProps = {
  /** 選んだ種類の名前。 */
  name: string;
  /** この画面で種類を選んだか。 */
  picked: boolean;
};

/** 選んだ種類の定義を読み、固定ページを作るフォームを出す。 */
export const NewPageEditor = ({
  name,
  picked,
}: NewPageEditorProps): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kind = useKind(name);

  const choose = (): void => {
    void navigate({ to: "/fixed-pages/new", search: {} });
  };

  const definition =
    kind._tag === "Loaded" && kind.data._tag === "Succeeded"
      ? kind.data.data
      : undefined;

  const ready = (
    <output className="sr-only">
      {definition !== undefined && t("fixedPageEditor.formReady")}
    </output>
  );

  if (definition === undefined) {
    return (
      <>
        {ready}
        <Titled title={t("fixedPageEditor.new")}>
          {kind._tag === "Loading" && (
            <LoadingState label={t("ui.loading")} layout="form" />
          )}
          {kind._tag === "Failed" && (
            <ErrorState
              description={t("fixedPageEditor.kindLoadFailedDescription")}
              isRetrying={kind.isRetrying}
              layout="screen"
              level={2}
              onRetry={kind.retry}
              title={t("fixedPageEditor.kindLoadFailed")}
            />
          )}
          {kind._tag === "Loaded" && (
            <Stack align="start" gap={3}>
              <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
              <Button onPress={choose}>
                {t("fixedPageEditor.chooseAgain")}
              </Button>
            </Stack>
          )}
        </Titled>
      </>
    );
  }

  const refreshFailure =
    kind._tag === "Loaded" ? kind.refreshFailure : undefined;

  return (
    <>
      {ready}
      <FixedPageEditor
        key={name}
        kind={definition}
        refreshFailure={refreshFailure}
        picked={picked}
        onSaved={(saved) => {
          void navigate({
            to: "/fixed-pages/$id",
            params: { id: saved.id },
            replace: true,
            ignoreBlocker: true,
          });
        }}
      />
    </>
  );
};
