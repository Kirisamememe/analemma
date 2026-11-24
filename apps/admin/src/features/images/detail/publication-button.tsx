import type { ReactNode } from "react";

import { usePublication } from "./hooks/use-publication";
import type { AdminImage } from "./queries/image-query";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

/** 公開と非公開を切り替えるボタンに渡す値。 */
type PublicationButtonProps = {
  /** 別の画像を取得していて操作できないか。 */
  isDisabled?: boolean;
  /** 切り替える画像。 */
  image: AdminImage;
};

/** 押すと画像を公開するか、非公開にするボタン。 */
export const PublicationButton = ({
  image,
  isDisabled = false,
}: PublicationButtonProps): ReactNode => {
  const t = useTranslate();
  const publication = usePublication(image, isDisabled);

  return (
    <>
      <Button
        size="sm-to-md"
        isPending={publication.isPending && !publication.isConfirming}
        onPress={publication.toggle}
        tone={image.published ? "secondary" : "primary"}
      >
        {t(image.published ? "imageDetail.unpublish" : "imageDetail.publish")}
      </Button>
      <Dialog
        isOpen={publication.isConfirming}
        isPending={publication.isPending}
        onOpenChange={(open) => {
          if (!open) publication.cancel();
        }}
        title={t("imageDetail.unpublishTitle", {
          title: image.title ?? t("imageDetail.untitled"),
        })}
      >
        <Cluster gap={2} justify="end">
          <Button
            isDisabled={publication.isPending}
            onPress={publication.cancel}
          >
            {t("imageDetail.cancel")}
          </Button>
          <Button
            isPending={publication.isPending}
            onPress={publication.unpublish}
            tone="primary"
          >
            {t("imageDetail.unpublish")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
