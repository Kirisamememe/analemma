import type { ReactNode, RefObject } from "react";
import { useTranslation } from "react-i18next";

import { RouteLink } from "@/routes/navigation/route-link";
import { Text } from "@/ui/layout";

/** 一覧へ戻るリンクを受け取る部品に渡す値。 */
type BackProps = {
  /** 一覧へ戻るリンク。 */
  back: RefObject<HTMLAnchorElement | null>;
};

/** ビューアの帯に置く、一覧へ戻るリンク。 */
export const ViewerBack = ({ back }: BackProps): ReactNode => {
  const { t } = useTranslation();

  return (
    <Text variant="caption">
      <RouteLink ref={back} to="/images" variant="back">
        {t("imageDetail.backToList")}
      </RouteLink>
    </Text>
  );
};
