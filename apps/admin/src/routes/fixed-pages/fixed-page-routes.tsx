import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { callApi } from "@/api/call-api";
import { useApiQuery } from "@/api/server-state/server-state";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import { Center, Heading, Stack } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

const KindPicker = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useApiQuery({
    key: ["admin", "kinds", "list"],
    load: () => api.admin.kinds.list(),
  });

  if (query._tag === "Loading") {
    return <Notice tone="info">{t("fixedPages.loading")}</Notice>;
  }

  if (query._tag === "Failed") {
    return <Notice tone="danger">{t("fixedPages.loadFailed")}</Notice>;
  }

  return (
    <Stack gap={4}>
      <Heading level={2}>{t("fixedPages.chooseKind")}</Heading>
      {query.data.kinds.length === 0 && (
        <Notice tone="info">{t("fixedPages.emptyKinds")}</Notice>
      )}
      {query.data.kinds.map((kind) => (
        <Button
          key={kind.name}
          onPress={() => {
            void navigate({
              to: "/fixed-pages/new",
              search: { kind: kind.name },
            });
          }}
        >
          {kind.label}
        </Button>
      ))}
    </Stack>
  );
};

type KindEditorProps = {
  /** 種類の名前。 */
  name: string;
  /** 編集する固定ページ。 */
  page?: ApiOutputs["admin"]["fixedPages"]["get"];
};
const KindEditor = ({ name, page }: KindEditorProps): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useApiQuery({
    key: ["admin", "kinds", "get", name],
    load: () => callApi(api.admin.kinds.get({ name }), ["NOT_FOUND"]),
  });

  if (query._tag === "Loading") {
    return <Notice tone="info">{t("fixedPages.loading")}</Notice>;
  }

  if (query._tag === "Failed") {
    return <Notice tone="danger">{t("fixedPages.loadFailed")}</Notice>;
  }

  if (query.data._tag === "Failed") {
    return <Notice tone="warning">{t("fixedPages.kindGone")}</Notice>;
  }

  return (
    <FixedPageEditor
      key={page?.id ?? name}
      kind={query.data.data}
      page={page}
      onSaved={(saved) => {
        if (page === undefined) {
          void navigate({
            to: "/fixed-pages/$id",
            params: { id: saved.id },
            replace: true,
          });
        }
      }}
    />
  );
};

/** 種類を選んで固定ページを作る画面。 */
export const NewFixedPage = (): ReactNode => {
  const { t } = useTranslation();
  const { kind } = useSearch({ from: "/signed-in/fixed-pages/new" });

  return (
    <Center width="form">
      <Stack gap={6}>
        <Heading level={1}>{t("fixedPages.new")}</Heading>
        {kind === undefined ? <KindPicker /> : <KindEditor name={kind} />}
      </Stack>
    </Center>
  );
};

/** 固定ページと種類の定義を読んで編集する画面。 */
export const EditFixedPage = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const { id } = useParams({ from: "/signed-in/fixed-pages/$id" });
  const query = useApiQuery({
    key: ["admin", "fixedPages", "get", id],
    load: () => callApi(api.admin.fixedPages.get({ id }), ["NOT_FOUND"]),
  });
  let body: ReactNode;

  if (query._tag === "Loading") {
    body = <Notice tone="info">{t("fixedPages.loading")}</Notice>;
  } else if (query._tag === "Failed") {
    body = <Notice tone="danger">{t("fixedPages.loadFailed")}</Notice>;
  } else if (query.data._tag === "Failed") {
    body = <Notice tone="warning">{t("fixedPages.pageGone")}</Notice>;
  } else {
    body = <KindEditor name={query.data.data.kind} page={query.data.data} />;
  }

  return (
    <Center width="form">
      <Stack gap={6}>
        <Heading level={1}>{t("fixedPages.edit")}</Heading>
        {body}
      </Stack>
    </Center>
  );
};
