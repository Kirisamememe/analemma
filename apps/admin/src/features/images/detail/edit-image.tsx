import { type ReactNode, useState } from "react";

import {
  hasUnsavedChanges,
  isValidImageText,
  toImageText,
} from "./logic/image-text";
import { saveImage } from "./queries/image-actions";
import {
  imageQueryKey,
  loadImage,
  type LoadedImage,
} from "./queries/image-query";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import { useLeaveConfirmation } from "@/api/leave-confirmation";
import { useApiCache, useApiMutation } from "@/api/server-state/server-state";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { IMAGES_QUERY_KEY } from "@/features/images/queries/images-query";
import { type MessageKey, useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
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
  /** 編集する画像。 */
  image: Image;
  /** 閉じる関数。 */
  onClose: () => void;
};

const EditImageDialog = ({
  image,
  onClose,
}: EditImageDialogProps): ReactNode => {
  const t = useTranslate();
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh, replace } = useApiCache();
  const { api } = useAppContext();

  const [confirmClose, setConfirmClose] = useState(false);
  const initial = toImageText(image);

  const close = (): void => {
    failure.close();
    onClose();
  };

  const saving = useApiMutation({
    send: async (values: ReturnType<typeof toImageText>) => ({
      id: image.id,
      result: await saveImage(api, { id: image.id, values }),
    }),
    onSuccess: async ({ result, id }) => {
      if (result._tag === "Saved") {
        await replace(imageQueryKey(result.image.id), {
          _tag: "Succeeded",
          data: result.image,
        } satisfies LoadedImage);
        await refresh(IMAGES_QUERY_KEY);
        onClose();
        showToast({ tone: "success", message: t("imageDetail.saved") });
      } else {
        failure.show(t("imageDetail.gone"));
        await refresh(imageQueryKey(id)); // もう無いことを、画面にも出す
        await refresh(IMAGES_QUERY_KEY);
      }
    },
    onError: () => {
      failure.show(t("imageDetail.saveFailed"));
    },
  });

  const form = useAppForm({
    canSubmitWhenInvalid: true,
    defaultValues: initial,
    onSubmit: ({ value }) => {
      failure.close();
      saving.mutate(value);
    },
  });

  const changed = (): boolean =>
    hasUnsavedChanges({ saved: initial, current: form.state.values });

  const leaving = useLeaveConfirmation(() => changed());

  const requestClose = (): void => {
    if (changed()) setConfirmClose(true);
    else close();
  };

  const stay = (): void => {
    if (leaving._tag === "Asking") leaving.stay();

    setConfirmClose(false);
  };

  const check = (name: keyof typeof INVALID) =>
    checkAfterSubmit((value: string) =>
      isValidImageText(name, value) ? undefined : t(INVALID[name]),
    );

  return (
    <>
      <Dialog
        isOpen
        isPending={saving.isPending}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={t("imageDetail.editTitle")}
      >
        <form.AppForm>
          <form.Form isPending={saving.isPending}>
            <form.AppField
              name="title"
              validators={{ onChange: check("title") }}
            >
              {(field) => (
                <field.TextField
                  isReadOnly={saving.isPending}
                  autoComplete="off"
                  label={t("imageDetail.title")}
                />
              )}
            </form.AppField>
            <form.AppField
              name="description"
              validators={{ onChange: check("description") }}
            >
              {(field) => (
                <field.TextArea
                  isReadOnly={saving.isPending}
                  label={t("imageDetail.description")}
                />
              )}
            </form.AppField>
            <form.AppField name="alt" validators={{ onChange: check("alt") }}>
              {(field) => (
                <field.TextField
                  isReadOnly={saving.isPending}
                  autoComplete="off"
                  description={t("imageDetail.altHint")}
                  label={t("imageDetail.alt")}
                />
              )}
            </form.AppField>
            <Cluster gap={2} justify="end">
              <Button isDisabled={saving.isPending} onPress={requestClose}>
                {t("imageDetail.cancel")}
              </Button>
              <Button isPending={saving.isPending} tone="primary" type="submit">
                {t("imageDetail.save")}
              </Button>
            </Cluster>
          </form.Form>
        </form.AppForm>
      </Dialog>
      <Dialog
        isOpen={confirmClose || leaving._tag === "Asking"}
        title={t("imageDetail.discardTitle")}
        onOpenChange={(open) => {
          if (!open) stay();
        }}
      >
        <Text>{t("imageDetail.discardDescription")}</Text>
        <Cluster gap={2} justify="end">
          <Button onPress={stay}>{t("imageDetail.continueEditing")}</Button>
          <Button
            tone="danger"
            onPress={() => {
              if (leaving._tag === "Asking") leaving.leave();

              close();
            }}
          >
            {t("imageDetail.discard")}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};

/** 編集する画像に渡す値。 */
type EditImageProps = {
  /** 編集する画像。 */
  image: Image;
};

const EditButton = ({ image }: EditImageProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const { refresh } = useApiCache();
  const failure = useFailureToast();
  const [editing, setEditing] = useState<Image>();

  const opening = useApiMutation({
    send: () => loadImage(api, image.id),
    onSuccess: async (result) => {
      if (result._tag === "Succeeded") {
        setEditing(result.data);
      } else {
        failure.show(t("imageDetail.gone"));
        await refresh(imageQueryKey(image.id));
      }
    },
    onError: () => {
      failure.show(t("imageDetail.loadFailed"));
    },
  });

  return (
    <>
      <Button
        isPending={opening.isPending}
        onPress={() => {
          failure.close();
          opening.mutate();
        }}
      >
        <Icon name="pencil" />
        {t("imageDetail.edit")}
      </Button>
      {editing !== undefined && (
        <EditImageDialog
          image={editing}
          onClose={() => {
            setEditing(undefined);
          }}
        />
      )}
    </>
  );
};

/** 押すとタイトル・説明・alt を編集する Dialog を開くボタン。 */
export const EditImage = ({ image }: EditImageProps): ReactNode => (
  <EditButton image={image} key={image.id} />
);
