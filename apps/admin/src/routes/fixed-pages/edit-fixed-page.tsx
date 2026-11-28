import { useNavigate, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EditorFrame } from "./editor-frame";
import { useKind } from "./hooks/use-kind";
import { Titled } from "./titled";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import { DeleteFixedPage } from "@/features/fixed-pages/editor/frame/delete-fixed-page";
import {
  fixedPageQueryKey,
  loadFixedPage,
} from "@/features/fixed-pages/editor/queries/fixed-page-query";
import { ErrorState, LoadingState } from "@/ui/patterns";
import { Notice } from "@/ui/primitives/notice";

/** 固定ページと種類の定義を読んで編集する画面。 */
export const EditFixedPage = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/signed-in/fixed-pages/$id" });

  const query = useApiQuery({
    key: fixedPageQueryKey(id),
    load: () => loadFixedPage(api, id),
  });

  const page =
    query._tag === "Loaded" && query.data._tag === "Succeeded"
      ? query.data.data
      : undefined;

  const kind = useKind(page?.kind, page?.content);

  const onDeleted = (): void => {
    void navigate({ to: "/fixed-pages", ignoreBlocker: true });
  };

  if (
    page !== undefined &&
    kind._tag === "Loaded" &&
    kind.data._tag === "Succeeded"
  ) {
    return (
      <EditorFrame ready>
        <FixedPageEditor
          key={page.id}
          kind={kind.data.data}
          refreshFailure={kind.refreshFailure}
          onDeleted={onDeleted}
          onSaved={() => undefined}
          page={page}
        />
      </EditorFrame>
    );
  }

  const unloaded = (): ReactNode => {
    if (query._tag === "Failed") {
      return (
        <ErrorState
          isRetrying={query.isRetrying}
          layout="screen"
          level={2}
          onRetry={query.retry}
          title={t("fixedPageEditor.loadFailed")}
        />
      );
    }

    return query._tag === "Loaded" && page === undefined ? (
      <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
    ) : (
      <LoadingState layout="form" />
    );
  };

  if (page === undefined || kind._tag === "Loading") {
    return (
      <EditorFrame ready={false}>
        <Titled title={t("fixedPageEditor.edit")}>{unloaded()}</Titled>
      </EditorFrame>
    );
  }

  return (
    <EditorFrame ready={false}>
      <Titled
        actions={
          <DeleteFixedPage
            isDisabled={kind._tag === "Failed" && kind.isRetrying} // 取り直して編集のフォームに替わると、削除の Dialog ごと消える
            onDeleted={onDeleted}
            page={page}
          />
        }
        description={t("fixedPageEditor.kindOf", { kind: page.kind })}
        title={t("fixedPageEditor.edit")}
      >
        {kind._tag === "Failed" ? (
          <ErrorState
            description={t("fixedPageEditor.kindLoadFailedDescription")}
            isRetrying={kind.isRetrying}
            layout="screen"
            level={2}
            onRetry={kind.retry}
            title={t("fixedPageEditor.kindLoadFailed")}
          />
        ) : (
          <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
        )}
      </Titled>
    </EditorFrame>
  );
};
