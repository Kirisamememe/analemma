import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { callApi } from "@/api/call-api";
import { useApiQuery } from "@/api/server-state/server-state";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import { Center, Cluster, Heading, Stack, Text } from "@/ui/layout";
import { EmptyState, PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type Page = ApiOutputs["admin"]["fixedPages"]["get"];

type ScreenProps = {
  /** 画面の名前。 */
  title: string;
  /** 画面の補足。 */
  description?: string | undefined;
  /** 見出しの下に置く中身。 */
  children: ReactNode;
};

const Screen = ({ title, description, children }: ScreenProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="form">
      <Stack gap={8}>
        <Stack gap={3}>
          <Text variant="caption">
            <Link href="/fixed-pages">{t("fixedPageEditor.backToList")}</Link>
          </Text>
          <PageHeader description={description} title={title} />
        </Stack>
        {children}
      </Stack>
    </Center>
  );
};

const Loading = (): ReactNode => {
  const { t } = useTranslation();

  return <Text tone="muted">{t("fixedPageEditor.loading")}</Text>;
};

const LoadFailed = (): ReactNode => {
  const { t } = useTranslation();

  return <Notice tone="danger">{t("fixedPageEditor.loadFailed")}</Notice>;
};

const useKind = (name: string) => {
  const { api } = useAppContext();

  return useApiQuery({
    key: ["admin", "kinds", "get", name],
    load: () => callApi(api.admin.kinds.get({ name }), ["NOT_FOUND"]),
    discardWhenUnused: true,
  });
};

const KindPicker = (): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useApiQuery({
    key: ["admin", "kinds", "list"],
    load: () => api.admin.kinds.list(),
  });

  if (query._tag === "Loading") return <Loading />;

  if (query._tag === "Failed") return <LoadFailed />;

  if (query.data.kinds.length === 0) {
    return (
      <EmptyState
        description={t("fixedPageEditor.emptyKindsDescription")}
        icon="file-text"
        title={t("fixedPageEditor.emptyKinds")}
      />
    );
  }

  return (
    <Stack gap={3}>
      <Heading level={2}>{t("fixedPageEditor.chooseKind")}</Heading>
      <Cluster gap={2}>
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
      </Cluster>
    </Stack>
  );
};

type NewPageEditorProps = {
  /** 選んだ種類の名前。 */
  name: string;
};

const NewPageEditor = ({ name }: NewPageEditorProps): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kind = useKind(name);
  const loaded = kind._tag === "Loaded" ? kind.data : undefined;
  const choose = (): void => {
    void navigate({ to: "/fixed-pages/new", search: {} });
  };

  let body: ReactNode;

  if (kind._tag === "Loading") {
    body = <Loading />;
  } else if (kind._tag === "Failed") {
    body = <LoadFailed />;
  } else if (kind.data._tag === "Failed") {
    body = (
      <Stack align="start" gap={3}>
        <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
        <Button onPress={choose}>{t("fixedPageEditor.chooseAgain")}</Button>
      </Stack>
    );
  } else {
    body = (
      <FixedPageEditor
        key={name}
        kind={kind.data.data}
        onSaved={(saved) => {
          void navigate({
            to: "/fixed-pages/$id",
            params: { id: saved.id },
            replace: true,
          });
        }}
      />
    );
  }

  return (
    <Screen
      description={
        loaded?._tag === "Succeeded"
          ? t("fixedPageEditor.kindOf", { kind: loaded.data.label })
          : undefined
      }
      title={t("fixedPageEditor.new")}
    >
      {body}
    </Screen>
  );
};

/** 種類を選んで固定ページを作る画面。 */
export const NewFixedPage = (): ReactNode => {
  const { t } = useTranslation();
  const { kind } = useSearch({ from: "/signed-in/fixed-pages/new" });

  return kind === undefined ? (
    <Screen
      description={t("fixedPageEditor.newDescription")}
      title={t("fixedPageEditor.new")}
    >
      <KindPicker />
    </Screen>
  ) : (
    <NewPageEditor name={kind} />
  );
};

type PageEditorProps = {
  /** 編集する固定ページ。 */
  page: Page;
};

const PageEditor = ({ page }: PageEditorProps): ReactNode => {
  const { t } = useTranslation();
  const kind = useKind(page.kind);
  let body: ReactNode;
  let kindLabel = page.kind;

  if (kind._tag === "Loading") {
    body = <Loading />;
  } else if (kind._tag === "Failed") {
    body = <LoadFailed />;
  } else if (kind.data._tag === "Failed") {
    body = <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>;
  } else {
    kindLabel = kind.data.data.label;
    body = (
      <FixedPageEditor
        key={page.id}
        kind={kind.data.data}
        onSaved={() => undefined}
        page={page}
      />
    );
  }

  return (
    <Screen
      description={t("fixedPageEditor.kindOf", { kind: kindLabel })}
      title={t("fixedPageEditor.edit")}
    >
      {body}
    </Screen>
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
    discardWhenUnused: true,
  });

  if (query._tag === "Loaded" && query.data._tag === "Succeeded") {
    return <PageEditor page={query.data.data} />;
  }

  return (
    <Screen title={t("fixedPageEditor.edit")}>
      {query._tag === "Loading" && <Loading />}
      {query._tag === "Failed" && <LoadFailed />}
      {query._tag === "Loaded" && (
        <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
      )}
    </Screen>
  );
};
