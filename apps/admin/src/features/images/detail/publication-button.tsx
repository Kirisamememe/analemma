import type { ReactNode } from "react";

import { setPublication } from "./queries/image-actions";
import { imageQueryKey, type LoadedImage } from "./queries/image-query";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
import { useTranslate } from "@/i18n/use-translate";
import { Button } from "@/ui/primitives/button";
import { useShowToast } from "@/ui/primitives/overlays";

const DONE = {
  Published: "imageDetail.publishDone",
  Unpublished: "imageDetail.unpublishDone",
} as const;

/** 公開と非公開を切り替えるボタンに渡す値。 */
type PublicationButtonProps = {
  /** 切り替える画像。 */
  image: ApiOutputs["admin"]["images"]["get"];
};

/** 押すと画像を公開するか、非公開にするボタン。 */
export const PublicationButton = ({
  image,
}: PublicationButtonProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const { refresh, replace } = useApiCache();
  const { api } = useAppContext();

  const publication = useApiMutation({
    send: () =>
      setPublication(api, { id: image.id, published: !image.published }),
    onSuccess: async (result) => {
      if (result._tag === "NotFound") {
        showToast({ tone: "danger", message: t("imageDetail.gone") });
        await refresh(imageQueryKey(image.id)); // もう無いことを、画面にも出す
      } else {
        await replace(imageQueryKey(image.id), {
          _tag: "Succeeded",
          data: result.image,
        } satisfies LoadedImage);
        showToast({ tone: "success", message: t(DONE[result._tag]) });
      }

      await refresh(IMAGES_QUERY_KEY);
    },
    onError: () => {
      void refresh(imageQueryKey(image.id)); // 変えられてから応答だけが失敗したときも、画面を合わせる
      showToast({
        tone: "danger",
        message: t("imageDetail.publicationFailed"),
      });
    },
  });

  return (
    <Button
      isPending={publication.isPending}
      onPress={() => {
        publication.mutate();
      }}
      tone={image.published ? "secondary" : "primary"}
    >
      {t(image.published ? "imageDetail.unpublish" : "imageDetail.publish")}
    </Button>
  );
};
