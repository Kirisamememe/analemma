import type { ReactNode } from "react";

import type { useUploadDialog } from "../hooks/use-upload-dialog";

import { useTranslate } from "@/i18n/use-translate";
import { Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";

type UploadProblemProps = {
  /** 保存できなかった写真と、その理由(無ければ何も出さない)。 */
  problem: ReturnType<typeof useUploadDialog>["problem"];
};

/** 入力を保存できなかった写真の名前と理由と、その写真を開く操作。 */
export const UploadProblem = ({ problem }: UploadProblemProps): ReactNode => {
  const t = useTranslate();

  if (!problem) return null;

  return (
    <div role="alert">
      <Text tone="danger">
        {t("imageUpload.problem", {
          name: problem.name,
          message: t(problem.message),
        })}
      </Text>
      {problem.show && (
        <Button onPress={problem.show}>{t("imageUpload.editPhoto")}</Button>
      )}
    </div>
  );
};
