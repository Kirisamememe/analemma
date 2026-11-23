import { type ReactNode, useState } from "react";

import { mergeImageChange } from "./logic/merge-image-change";
import { setPublication } from "./queries/image-actions";
import { imageQueryKey, type LoadedImage } from "./queries/image-query";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import {
  IMAGES_QUERY_KEY,
  updateImagePage,
} from "@/features/images/queries/images-query";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

/** 公開と非公開を切り替えるボタンに渡す値。 */
type PublicationButtonProps = {
  /** 別の画像を取得していて操作できないか。 */
  isDisabled?: boolean;
  /** 切り替える画像。 */
  image: ApiOutputs["admin"]["images"]["get"];
};

/** 押すと画像を公開するか、非公開にするボタン。 */
export const PublicationButton = ({
  image,
  isDisabled = false,
}: PublicationButtonProps): ReactNode => {
  const t = useTranslate();
  const [confirming, setConfirming] = useState(false);
  const failure = useFailureToast();
  const showToast = useShowToast();
  const { refresh, update, updatePages } = useApiCache();
  const { api } = useAppContext();

  const publication = useApiMutation({
    scope: `image:${image.id}`,
    send: (published: boolean) =>
      setPublication(api, { id: image.id, published }),
    onSuccess: async (result) => {
      setConfirming(false);

      if (result._tag === "Failed") {
        failure.show(t("imageDetail.gone"));
        await Promise.all([
          update(imageQueryKey(image.id), () => result),
          updatePages(IMAGES_QUERY_KEY, updateImagePage(image.id)),
        ]);
      } else {
        const apply = mergeImageChange(result.data, "publication");
        await Promise.all([
          update<LoadedImage>(imageQueryKey(result.data.id), (current) =>
            current._tag === "Succeeded"
              ? { ...current, data: apply(current.data) }
              : current,
          ),
          updatePages(IMAGES_QUERY_KEY, updateImagePage(result.data.id, apply)),
        ]);

        const message = result.data.published
          ? "imageDetail.publishDone"
          : "imageDetail.unpublishDone";

        showToast({ tone: "success", message: t(message) });
      }
    },
    onError: () => {
      void refresh(IMAGES_QUERY_KEY, "active");
      void refresh(imageQueryKey(image.id)); // 変えられてから応答だけが失敗したときも、画面を合わせる
      failure.show(t("imageDetail.publicationFailed"));
    },
  });

  const send = (published: boolean): void => {
    failure.close();
    publication.mutate(published);
  };

  const close = (): void => {
    failure.close();
    setConfirming(false);
  };

  return (
    <>
      <Button
        size="sm-to-md"
        isDisabled={isDisabled}
        isPending={publication.isPending && !confirming}
        onPress={() => {
          if (image.published) setConfirming(true);
          else send(true);
        }}
        tone={image.published ? "secondary" : "primary"}
      >
        {t(image.published ? "imageDetail.unpublish" : "imageDetail.publish")}
      </Button>
      <Dialog
        isOpen={confirming}
        isPending={publication.isPending}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t("imageDetail.unpublishTitle", {
          title: image.title ?? t("imageDetail.untitled"),
        })}
      >
        <Cluster gap={2} justify="end">
          <Button isDisabled={publication.isPending} onPress={close}>
            {t("imageDetail.cancel")}
          </Button>
          <Button
            isPending={publication.isPending}
            onPress={() => {
              if (confirming) send(false);
            }}
            tone="primary"
          >
            {t("imageDetail.unpublish")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
