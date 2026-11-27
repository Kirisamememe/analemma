import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/primitives/badge";

/** 入力が要ることを示すラベル。 */
export const RequiredBadge = (): ReactNode => {
  const { t } = useTranslation();

  return (
    <span aria-hidden="true" className="flex shrink-0">
      <Badge tone="danger" variant="soft">
        {t("ui.required")}
      </Badge>
    </span>
  );
};
