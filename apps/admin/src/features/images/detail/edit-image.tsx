import { type ReactNode, useState } from "react";

import { isValidImageText, toImageText } from "./logic/image-text";
import { saveImage } from "./queries/image-actions";
import { imageQueryKey, type LoadedImage } from "./queries/image-query";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

type Image = ApiOutputs["admin"]["images"]["get"];

const INVALID: Readonly<Record<"title" | "description" | "alt", MessageKey>> = {
  title: "imageDetail.invalidTitle",
  description: "imageDetail.invalidDescription",
  alt: "imageDetail.invalidAlt",
};

/** 画像のタイトル・説明・alt を編集する Dialog に渡す値。 */
type EditImageDialogProps = {
  /** 開いているか。 */
  isOpen: boolean;
  /** 編集する画像。 */
  image: Image;
  /** 閉じる関数。 */
  onClose: () => void;
};

const EditImageDialog = ({
  isOpen,
  image,
  onClose,
}: EditImageDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh, replace } = useApiCache();
  const { api } = useAppContext();

  const close = (): void => {
    failure.close();
    onClose();
  };

  const saving = useApiMutation({
    send: (values: ReturnType<typeof toImageText>) =>
      saveImage(api, { id: image.id, values }),
    onSuccess: async (result) => {
      if (result._tag === "Saved") {
        await replace(imageQueryKey(image.id), {
          _tag: "Succeeded",
          data: result.image,
        } satisfies LoadedImage);
        onClose();
        showToast({ tone: "success", message: t("imageDetail.saved") });
      } else {
        failure.show(t("imageDetail.gone"));
        await refresh(imageQueryKey(image.id)); // もう無いことを、画面にも出す
      }

      await refresh(IMAGES_QUERY_KEY);
    },
    onError: () => {
      failure.show(t("imageDetail.saveFailed"));
    },
  });

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: toImageText(image),
    onSubmit: ({ value }) => {
      failure.close();
      saving.mutate(value);
    },
  });

  const check = (name: keyof typeof INVALID) =>
    checkAfterSubmit((value: string) =>
      isValidImageText(name, value) ? undefined : t(INVALID[name]),
    );

  return (
    <Dialog
      isOpen={isOpen}
      isPending={saving.isPending}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={t("imageDetail.editTitle")}
    >
      <form.AppForm>
        <form.Form isPending={saving.isPending}>
          <form.AppField name="title" validators={{ onChange: check("title") }}>
            {(field) => (
              <field.TextField
                autoComplete="off"
                label={t("imageDetail.title")}
              />
            )}
          </form.AppField>
          <form.AppField
            name="description"
            validators={{ onChange: check("description") }}
          >
            {(field) => <field.TextArea label={t("imageDetail.description")} />}
          </form.AppField>
          <form.AppField name="alt" validators={{ onChange: check("alt") }}>
            {(field) => (
              <field.TextField
                autoComplete="off"
                description={t("imageDetail.altHint")}
                label={t("imageDetail.alt")}
              />
            )}
          </form.AppField>
          <Cluster gap={2} justify="end">
            <Button isDisabled={saving.isPending} onPress={close}>
              {t("imageDetail.cancel")}
            </Button>
            <Button isPending={saving.isPending} tone="primary" type="submit">
              {t("imageDetail.save")}
            </Button>
          </Cluster>
        </form.Form>
      </form.AppForm>
    </Dialog>
  );
};

/** 編集する画像に渡す値。 */
type EditImageProps = {
  /** 編集する画像。 */
  image: Image;
};

/** 押すとタイトル・説明・alt を編集する Dialog を開くボタン。 */
export const EditImage = ({ image }: EditImageProps): ReactNode => {
  const t = useTranslate();
  const [opened, setOpened] = useState(0); // 開くたびに Dialog を作り直し、前の入力と結果を残さない
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onPress={() => {
          setOpened((count) => count + 1);
          setIsOpen(true);
        }}
      >
        <Icon name="pencil" />
        {t("imageDetail.edit")}
      </Button>
      <EditImageDialog
        image={image}
        isOpen={isOpen}
        key={opened}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};
