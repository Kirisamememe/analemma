import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/api/app-context";
import { callApi } from "@/api/call-api";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { DeleteFixedPage } from "@/features/fixed-pages/editor/delete-fixed-page";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import {
  fixedPageQueryKey,
  loadFixedPage,
} from "@/features/fixed-pages/editor/queries/fixed-page-query";
import { KindsRefreshNotice } from "@/features/fixed-pages/list/kinds-refresh-notice";
import {
  KIND_STALE_TIME,
  KINDS_QUERY_KEY,
  kindQueryKey,
  loadKinds,
} from "@/features/fixed-pages/queries/fixed-pages-query";
import { Center, Cluster, Heading, Stack, Text } from "@/ui/layout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";
import { Notice } from "@/ui/primitives/notice";

type FrameProps = {
  /** 編集フォームを表示できたか。 */
  ready?: boolean;
  /** 一覧へ戻るリンクの下に置く、見出しと中身。 */
  children: ReactNode;
};

const Frame = ({ children, ready }: FrameProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Center width="nestedForm">
      <Stack gap={3}>
        <Text variant="caption">
          <Link href="/fixed-pages" variant="back">
            {t("fixedPageEditor.backToList")}
          </Link>
        </Text>
        {ready !== undefined && (
          <span aria-live="polite" className="sr-only">
            {ready && t("fixedPageEditor.editReady")}
          </span>
        )}
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

const useKind = (name: string | undefined) => {
  const { api } = useAppContext();

  return useApiQuery({
    key: kindQueryKey(name),
    tabStaleTime: (kind) => (kind?._tag === "Succeeded" ? KIND_STALE_TIME : 0),
    load:
      name === undefined
        ? undefined
        : () => callApi(api.admin.kinds.get({ name }), ["NOT_FOUND"]),
  });
};

type KindPickerProps = {
  /** 種類を選んだときに呼ぶ関数。 */
  onPick: () => void;
};

const KindPicker = ({ onPick }: KindPickerProps): ReactNode => {
  const { api } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const query = useApiQuery({
    key: KINDS_QUERY_KEY,
    tabStaleTime: KIND_STALE_TIME,
    load: () => loadKinds(api),
  });

  return (
    <Stack gap={3}>
      {query._tag === "Loaded" && query.refreshFailure !== undefined && (
        <KindsRefreshNotice refreshFailure={query.refreshFailure} />
      )}
      <QueryContent
        failedTitle={t("fixedPageEditor.kindsLoadFailed")}
        level={2}
        loading="list"
        query={query}
      >
        {({ kinds }) =>
          kinds.length === 0 ? (
            <EmptyState
              description={t("fixedPageEditor.emptyKindsDescription")}
              icon="file-text"
              title={t("fixedPageEditor.emptyKinds")}
            />
          ) : (
            <Stack gap={3}>
              <Heading level={2}>{t("fixedPageEditor.chooseKind")}</Heading>
              <Cluster gap={2}>
                {kinds.map((kind) => (
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
          )
        }
      </QueryContent>
    </Stack>
  );
};

type NewPageEditorProps = {
  /** 選んだ種類の名前。 */
  name: string;
  /** この画面で種類を選んだか。 */
  picked: boolean;
};

const NewPageEditor = ({ name, picked }: NewPageEditorProps): ReactNode => {
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

  return (
    <>
      <output className="sr-only">
        {definition !== undefined && t("fixedPageEditor.formReady")}
      </output>
      {definition === undefined ? (
        <Titled title={t("fixedPageEditor.new")}>
          {kind._tag === "Loading" && <LoadingState layout="form" />}
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
      ) : (
        <FixedPageEditor
          key={name}
          kind={definition}
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
      )}
    </>
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

  const kind = useKind(page?.kind);

  const onDeleted = (): void => {
    void navigate({ to: "/fixed-pages", ignoreBlocker: true });
  };

  if (
    page !== undefined &&
    kind._tag === "Loaded" &&
    kind.data._tag === "Succeeded"
  ) {
    return (
      <Frame ready>
        <FixedPageEditor
          key={page.id}
          kind={kind.data.data}
          onDeleted={onDeleted}
          onSaved={() => undefined}
          page={page}
        />
      </Frame>
    );
  }

  if (page === undefined || kind._tag === "Loading") {
    return (
      <Frame ready={false}>
        <Titled title={t("fixedPageEditor.edit")}>
          {query._tag === "Failed" ? (
            <ErrorState
              isRetrying={query.isRetrying}
              layout="screen"
              level={2}
              onRetry={query.retry}
              title={t("fixedPageEditor.loadFailed")}
            />
          ) : query._tag === "Loaded" && page === undefined ? (
            <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
          ) : (
            <LoadingState layout="form" />
          )}
        </Titled>
      </Frame>
    );
  }

  return (
    <Frame ready={false}>
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
    </Frame>
  );
};
