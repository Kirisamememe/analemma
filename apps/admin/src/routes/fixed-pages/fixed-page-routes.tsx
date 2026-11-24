import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { QueryContent } from "@/components/query-content";
import { DeleteFixedPage } from "@/features/fixed-pages/editor/delete-fixed-page";
import { FixedPageEditor } from "@/features/fixed-pages/editor/fixed-page-editor";
import {
  fixedPageQueryKey,
  loadFixedPage,
} from "@/features/fixed-pages/editor/queries/fixed-page-query";
import { useKindDefinition } from "@/features/fixed-pages/hooks/use-kind-definition";
import { useKinds } from "@/features/fixed-pages/hooks/use-kinds";
import { KindRefreshNotice } from "@/features/fixed-pages/list/kind-refresh-notice";
import {
  definitionScreen,
  editScreen,
} from "@/features/fixed-pages/logic/edit-screen";
import { KindGuide } from "@/features/fixed-pages/ui/kind-guide";
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

type KindPickerProps = {
  /** 種類を選んだときに呼ぶ関数。 */
  onPick: () => void;
};

const KindPicker = ({ onPick }: KindPickerProps): ReactNode => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useKinds();

  return (
    <Stack gap={3}>
      {query._tag === "Loaded" && query.refreshFailure !== undefined && (
        <KindRefreshNotice
          source="list"
          refreshFailure={query.refreshFailure}
        />
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
  const kind = useKindDefinition(name);

  const screen = definitionScreen(kind);

  const choose = (): void => {
    void navigate({ to: "/fixed-pages/new", search: {} });
  };

  return (
    <>
      <output className="sr-only">
        {screen._tag === "Editor" && t("fixedPageEditor.formReady")}
      </output>
      {screen._tag === "Editor" ? (
        <FixedPageEditor
          key={name}
          kind={screen.kind}
          refreshFailure={screen.refreshFailure}
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
      ) : (
        <Titled title={t("fixedPageEditor.new")}>
          {screen._tag === "Loading" && <LoadingState layout="form" />}
          {screen._tag === "KindFailed" && (
            <ErrorState
              description={t("fixedPageEditor.kindLoadFailedDescription")}
              isRetrying={screen.retry.isRetrying}
              layout="screen"
              level={2}
              onRetry={screen.retry.retry}
              title={t("fixedPageEditor.kindLoadFailed")}
            />
          )}
          {screen._tag === "KindGone" && (
            <Stack align="start" gap={3}>
              <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
              <Button onPress={choose}>
                {t("fixedPageEditor.chooseAgain")}
              </Button>
            </Stack>
          )}
        </Titled>
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
          <KindGuide />
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

  const kind = useKindDefinition(page?.kind, page?.content);
  const screen = editScreen(query, kind);

  const onDeleted = (): void => {
    void navigate({ to: "/fixed-pages", ignoreBlocker: true });
  };

  switch (screen._tag) {
    case "Editor":
      return (
        <Frame ready>
          <FixedPageEditor
            key={screen.page.id}
            kind={screen.kind}
            refreshFailure={screen.refreshFailure}
            onDeleted={onDeleted}
            onSaved={() => undefined}
            page={screen.page}
          />
        </Frame>
      );
    case "Loading":
    case "PageFailed":
    case "PageGone":
      return (
        <Frame ready={false}>
          <Titled title={t("fixedPageEditor.edit")}>
            {screen._tag === "PageFailed" && (
              <ErrorState
                isRetrying={screen.retry.isRetrying}
                layout="screen"
                level={2}
                onRetry={screen.retry.retry}
                title={t("fixedPageEditor.loadFailed")}
              />
            )}
            {screen._tag === "PageGone" && (
              <Notice tone="warning">{t("fixedPageEditor.pageGone")}</Notice>
            )}
            {screen._tag === "Loading" && <LoadingState layout="form" />}
          </Titled>
        </Frame>
      );
    case "KindFailed":
    case "KindGone":
      return (
        <Frame ready={false}>
          <Titled
            actions={
              <DeleteFixedPage
                isDisabled={
                  screen._tag === "KindFailed" && screen.retry.isRetrying
                } // 取り直して編集のフォームに替わると、削除の Dialog ごと消える
                onDeleted={onDeleted}
                page={screen.page}
              />
            }
            description={t("fixedPageEditor.kindOf", {
              kind: screen.page.kind,
            })}
            title={t("fixedPageEditor.edit")}
          >
            {screen._tag === "KindFailed" ? (
              <ErrorState
                description={t("fixedPageEditor.kindLoadFailedDescription")}
                isRetrying={screen.retry.isRetrying}
                layout="screen"
                level={2}
                onRetry={screen.retry.retry}
                title={t("fixedPageEditor.kindLoadFailed")}
              />
            ) : (
              <Notice tone="warning">{t("fixedPageEditor.kindGone")}</Notice>
            )}
          </Titled>
        </Frame>
      );
  }
};
