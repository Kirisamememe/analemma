import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Center, Stack, Text } from "@/ui/layout";
import { Link } from "@/ui/primitives/navigation";

/** 作成と編集の画面の枠に渡す値。 */
type EditorFrameProps = {
  /** 編集フォームを表示できたか。 */
  ready?: boolean;
  /** 一覧へ戻るリンクの下に置く、見出しと中身。 */
  children: ReactNode;
};

/** 一覧へ戻るリンクと、その下の見出しと中身を置く、作成と編集の画面の枠。 */
export const EditorFrame = ({
  children,
  ready,
}: EditorFrameProps): ReactNode => {
  const { t } = useTranslation();

  const readyText = ready === true && t("fixedPageEditor.editReady");

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
            {readyText}
          </span>
        )}
        {children}
      </Stack>
    </Center>
  );
};
