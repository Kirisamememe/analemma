import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { callApi } from "@/api/call-api";
import { useApiQuery } from "@/api/server-state/server-state";
import { DeleteFixedPage } from "@/features/fixed-pages/editor/delete-fixed-page";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import {
  fixedPageQueryKey,
  loadFixedPage,
} from "@/features/fixed-pages/editor/queries/fixed-page-query";
import {
  KINDS_QUERY_KEY,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { Center, Cluster, Heading, Stack, Text } from "@/ui/layout";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  useRetryFocus,
} from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type Page = ApiOutputs["admin"]["fixedPages"]["get"];

type FrameProps = {
  /** 一覧へ戻るリンクの下に置く、見出しと中身。 */
  children: ReactNode;
};

const Frame = ({ children }: FrameProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="form">
      <Stack gap={3}>
        <Text variant="caption">
          <Link href="/fixed-pages" variant="back">
            {t("fixedPageEditor.backToList")}
          </Link>
        </Text>
        {children}
      </Stack>
    </Center>
  );
};

type TitledProps = {
  /** 画面の名前。 */
  title: string;
  /** 画面の補足。 */
  description?: string | undefined;
  /** 見出しに置く操作。 */
  actions?: ReactNode;
  /** 見出しの下に置く中身。 */
  children: ReactNode;
};

const Titled = ({
  title,
  description,
  actions,
  children,
}: TitledProps): ReactNode => (
  <Stack gap={8}>
    <PageHeader actions={actions} description={description} title={title} />
    {children}
  </Stack>
);

const Loading = (): ReactNode => {
  const { t } = useTranslation();

  return <Text tone="muted">{t("fixedPageEditor.loading")}</Text>;
};

const useKind = (name: string) => {
  const { api } = useAppContext();

  return useApiQuery({
    key: ["admin", "kinds", "get", name],
    load: () => callApi(api.admin.kinds.get({ name }), ["NOT_FOUND"]),
    discardWhenUnused: true,
  });
};

type KindPickerProps = {
  /** 種類を選んだときに呼ぶ関数。 */
  onPick: () => void;
};

const KindPicker = ({ onPick }: KindPickerProps): ReactNode => {
  const { remember, focus } = useRetryFocus();
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const query = useApiQuery({
    key: KINDS_QUERY_KEY,
    load: () => loadKinds(api),
  });

  if (query._tag === "Loading") return <Loading />;

  if (query._tag === "Failed") {
    return (
      <ErrorState
        onRetryPress={remember}
        isRetrying={query.isRetrying}
        layout="inline"
        level={2}
        onRetry={query.retry}
        title={t("fixedPageEditor.kindsLoadFailed")}
      />
    );
  }

  if (query.data.kinds.length === 0) {
    return (
      <section
        aria-label={t("fixedPageEditor.chooseKind")}
        ref={focus}
        tabIndex={-1}
      >
        <EmptyState
          description={t("fixedPageEditor.emptyKindsDescription")}
          icon="file-text"
          title={t("fixedPageEditor.emptyKinds")}
        />
      </section>
    );
  }

  return (
    <section
      aria-label={t("fixedPageEditor.chooseKind")}
      ref={focus}
      tabIndex={-1}
    >
      <Stack gap={3}>
        <Heading level={2}>{t("fixedPageEditor.chooseKind")}</Heading>
        <Cluster gap={2}>
          {query.data.kinds.map((kind) => (
            <Button
              key={kind.name}
              onPress={() => {
                onPick();
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
    </section>
  );
};

type NewPageEditorProps = {
  /** 選んだ種類の名前。 */
  name: string;
  /** この画面で種類を選んだか。 */
  picked: boolean;
};

const NewPageEditor = ({ name, picked }: NewPageEditorProps): ReactNode => {
  const { remember, focus } = useRetryFocus();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kind = useKind(name);

  const choose = (): void => {
    void navigate({ to: "/fixed-pages/new", search: {} });
  };

  if (kind._tag === "Loaded" && kind.data._tag === "Succeeded") {
    return (
      <section aria-label={t("fixedPageEditor.new")} ref={focus} tabIndex={-1}>
        <FixedPageEditor
          key={name}
          kind={kind.data.data}
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
      </section>
    );
  }

  return (
    <Titled title={t("fixedPageEditor.new")}>
      {kind._tag === "Loading" && <Loading />}
      {kind._tag === "Failed" && (
        <ErrorState
          onRetryPress={remember}
          description={t("fixedPageEditor.kindLoadFailedDescription")}
          isRetrying={kind.isRetrying}
          layout="screen"
          level={2}
          onRetry={kind.retry}
          title={t("fixedPageEditor.kindLoadFailed")}
        />
      )}
      {kind._tag === "Loaded" && (
        <section
          aria-label={t("fixedPageEditor.new")}
          ref={focus}
          tabIndex={-1}
        >
          <Stack align="start" gap={3}>
            <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
            <Button onPress={choose}>{t("fixedPageEditor.chooseAgain")}</Button>
          </Stack>
        </section>
      )}
    </Titled>
  );
};

/** 種類を選んで固定ページを作る画面。 */
export const NewFixedPage = (): ReactNode => {
  const { t } = useTranslation();
  const { kind } = useSearch({ from: "/signed-in/fixed-pages/new" });
  const [picked, setPicked] = useState(false);

  return (
    <Frame>
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
        </Titled>
      ) : (
        <NewPageEditor name={kind} picked={picked} />
      )}
    </Frame>
  );
};

type PageEditorProps = {
  /** 編集する固定ページ。 */
  page: Page;
  /** 固定ページや種類を取り直した後の focus。 */
  remember: ReturnType<typeof useRetryFocus>["remember"];
  /** 読み込んだ欄へ focus を移す関数。 */
  focus: ReturnType<typeof useRetryFocus>["focus"];
};

const PageEditor = ({ page, remember, focus }: PageEditorProps): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const kind = useKind(page.kind);

  const onDeleted = (): void => {
    void navigate({ to: "/fixed-pages", ignoreBlocker: true });
  };

  if (kind._tag === "Loaded" && kind.data._tag === "Succeeded") {
    return (
      <section aria-label={t("fixedPageEditor.edit")} ref={focus} tabIndex={-1}>
        <FixedPageEditor
          key={page.id}
          kind={kind.data.data}
          onDeleted={onDeleted}
          onSaved={() => undefined}
          page={page}
        />
      </section>
    );
  }

  return (
    <Titled
      actions={
        kind._tag !== "Loading" && (
          <DeleteFixedPage
            isDisabled={kind._tag === "Failed" && kind.isRetrying} // 取り直して編集のフォームに替わると、削除の Dialog ごと消える
            onDeleted={onDeleted}
            page={page}
          />
        )
      }
      description={t("fixedPageEditor.kindOf", { kind: page.kind })}
      title={t("fixedPageEditor.edit")}
    >
      {kind._tag === "Loading" && <Loading />}
      {kind._tag === "Failed" && (
        <ErrorState
          onRetryPress={remember}
          description={t("fixedPageEditor.kindLoadFailedDescription")}
          isRetrying={kind.isRetrying}
          layout="screen"
          level={2}
          onRetry={kind.retry}
          title={t("fixedPageEditor.kindLoadFailed")}
        />
      )}
      {kind._tag === "Loaded" && (
        <section
          aria-label={t("fixedPageEditor.edit")}
          ref={focus}
          tabIndex={-1}
        >
          <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
        </section>
      )}
    </Titled>
  );
};

/** 固定ページと種類の定義を読んで編集する画面。 */
export const EditFixedPage = (): ReactNode => {
  const { remember, focus } = useRetryFocus();
  const { api } = useAppContext();
  const { t } = useTranslation();
  const { id } = useParams({ from: "/signed-in/fixed-pages/$id" });

  const query = useApiQuery({
    key: fixedPageQueryKey(id),
    load: () => loadFixedPage(api, id),
    discardWhenUnused: true,
  });

  return (
    <Frame>
      {query._tag === "Loaded" && query.data._tag === "Succeeded" ? (
        <PageEditor page={query.data.data} remember={remember} focus={focus} />
      ) : (
        <Titled title={t("fixedPageEditor.edit")}>
          {query._tag === "Loading" && <Loading />}
          {query._tag === "Failed" && (
            <ErrorState
              onRetryPress={remember}
              isRetrying={query.isRetrying}
              layout="screen"
              level={2}
              onRetry={query.retry}
              title={t("fixedPageEditor.loadFailed")}
            />
          )}
          {query._tag === "Loaded" && (
            <section
              aria-label={t("fixedPageEditor.edit")}
              ref={focus}
              tabIndex={-1}
            >
              <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
            </section>
          )}
        </Titled>
      )}
    </Frame>
  );
};
