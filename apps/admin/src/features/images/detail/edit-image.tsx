import { type ReactNode, useCallback, useId, useRef, useState } from "react";

import {
  hasUnsavedChanges,
  imageTextFields,
  imageTextSchemas,
  isValidImageText,
  toImageText,
} from "./logic/image-text";
import { mergeImageChange } from "./logic/merge-image-change";
import { saveImage } from "./queries/image-actions";
import {
  imageQueryKey,
  loadImage,
  type LoadedImage,
} from "./queries/image-query";

import type { ApiOutputs } from "@/api/api-types";
import { useAppContext } from "@/api/app-context";
import {
  useApiCache,
  useApiMutation,
  useIsApiMutationPending,
} from "@/api/server-state/server-state";
import { useLeaveConfirmation } from "@/api/use-leave-confirmation";
import { checkAfterSubmit, useAppForm } from "@/components/forms";
import { createFieldGuide } from "@/components/forms/logic/field-guide";
import { type MessageKey, useLocale, useTranslate } from "@/i18n/use-translate";
import { IMAGES_QUERY_KEY, updateImagePage } from "@/queries/images-query";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import {
  Dialog,
  useFailureToast,
  useShowToast,
} from "@/ui/primitives/overlays";

type Image = ApiOutputs["admin"]["images"]["get"];

const saveKey = (id: string) => ["admin", "images", "update", id];

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
  const guide = createFieldGuide(t, useLocale());
  const showToast = useShowToast();
  const failure = useFailureToast();
  const { refresh, update, updatePages } = useApiCache();
  const { api } = useAppContext();

  const [confirmClose, setConfirmClose] = useState(false);
  const initial = toImageText(image);
  const descriptionId = useId();

  const close = (): void => {
    failure.close();
    onClose();
  };

  const saving = useApiMutation({
    key: saveKey(image.id),
    scope: `image:${image.id}`,
    send: async (values: ReturnType<typeof toImageText>) => ({
      id: image.id,
      result: await saveImage(api, { id: image.id, values }),
    }),
    onSuccess: async ({ result, id }) => {
      if (result._tag === "Saved") {
        const apply = mergeImageChange(result.image, "text");
        await Promise.all([
          update<LoadedImage>(imageQueryKey(result.image.id), (current) =>
            current._tag === "Succeeded"
              ? { ...current, data: apply(current.data) }
              : current,
          ),
          updatePages(
            IMAGES_QUERY_KEY,
            updateImagePage(result.image.id, apply),
          ),
        ]);
        leaving.leave();
        onClose();
        showToast({ tone: "success", message: t("imageDetail.saved") });
      } else {
        failure.show(t("imageDetail.gone"));
        leaving.leave();
        onClose();
        await Promise.all([
          refresh(imageQueryKey(id)),
          updatePages(IMAGES_QUERY_KEY, updateImagePage(id)),
        ]);
      }
    },
    onError: () => {
      failure.show(t("imageDetail.saveFailed"));
      void refresh(imageQueryKey(image.id), "active");
      void refresh(IMAGES_QUERY_KEY, "active");
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

  const changed = (): boolean => hasUnsavedChanges(initial, form.state.values);

  const leaving = useLeaveConfirmation(() => saving.isPending || changed());

  const leavingWhileSaving = leaving._tag === "Asking" && saving.isPending;

  const prompt = leavingWhileSaving
    ? {
        title: t("imageDetail.leavingWhileSaving"),
        description: t("imageDetail.savingWillContinue"),
        stay: t("imageDetail.waitForSave"),
        leave: t("imageDetail.leaveDuringSave"),
      }
    : {
        title: t("imageDetail.discardTitle"),
        description: t("imageDetail.discardDescription"),
        stay: t("imageDetail.continueEditing"),
        leave: t("imageDetail.discard"),
      };

  const requestClose = (): void => {
    if (changed()) setConfirmClose(true);
    else close();
  };

  const stay = (): void => {
    leaving.stay();

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
            {imageTextFields.map((name) => (
              <form.AppField
                key={name}
                name={name}
                validators={{ onChange: check(name) }}
              >
                {(field) =>
                  name === "description" ? (
                    <field.TextArea
                      isReadOnly={saving.isPending}
                      label={t("imageDetail.description")}
                      placeholder={t("imageDetail.descriptionPlaceholder")}
                      description={guide(imageTextSchemas.description)}
                    />
                  ) : (
                    <field.TextField
                      autoComplete="off"
                      placeholder={
                        name === "title"
                          ? t("imageDetail.titlePlaceholder")
                          : undefined
                      }
                      description={
                        name === "alt"
                          ? guide(imageTextSchemas.alt, {
                              hint: t("imageDetail.guide.alt"),
                            })
                          : guide(imageTextSchemas.title)
                      }
                      isReadOnly={saving.isPending}
                      label={t(`imageDetail.${name}`)}
                    />
                  )
                }
              </form.AppField>
            ))}
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
        descriptionId={descriptionId}
        title={prompt.title}
        onOpenChange={(open) => {
          if (!open) stay();
        }}
      >
        <Text>
          <span id={descriptionId}>{prompt.description}</span>
        </Text>
        <Cluster gap={2} justify="end">
          <Button onPress={stay}>{prompt.stay}</Button>
          <Button
            tone={leavingWhileSaving ? "secondary" : "danger"}
            onPress={() => {
              leaving.leave();

              close();
            }}
          >
            {prompt.leave}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};

/** 編集する画像に渡す値。 */
type EditImageProps = {
  /** 別の画像を取得していて操作できないか。 */
  isDisabled?: boolean;
  /** 編集する画像。 */
  image: Image;
};

type EditRequest = Pick<Image, "id">;

/** 押すとタイトル・説明・alt を編集する Dialog を開く。 */
export const EditImage = ({
  image,
  isDisabled = false,
}: EditImageProps): ReactNode => {
  const t = useTranslate();
  const { api } = useAppContext();
  const { refresh } = useApiCache();
  const failure = useFailureToast(image.id);
  const [editing, setEditing] = useState<Image>();
  const [openingId, setOpeningId] = useState<string>();
  const request = useRef<EditRequest>(undefined);
  const id = image.id;
  const isSaving = useIsApiMutationPending(saveKey(id));

  const attach = useCallback(
    (button: HTMLButtonElement | null) => {
      if (button === null || isDisabled || request.current?.id !== id) {
        request.current = undefined;
      }
    },
    [id, isDisabled],
  );

  if (editing !== undefined && (isDisabled || editing.id !== id)) {
    setEditing(undefined);
  }

  if (openingId !== undefined && (isDisabled || openingId !== id)) {
    setOpeningId(undefined);
  }

  const opening = useApiMutation({
    key: ["admin", "images", "edit", id],
    scope: `image:${id}`,
    send: (target: EditRequest) => loadImage(api, target.id),
    onSuccess: async (result, target) => {
      if (request.current !== target) return;

      request.current = undefined;

      if (result._tag === "Succeeded") setEditing(result.data);
      else {
        failure.show(t("imageDetail.gone"));
        await refresh(imageQueryKey(target.id));
      }
    },
    onError: (target) => {
      if (request.current === target) {
        request.current = undefined;
        failure.show(t("imageDetail.loadFailed"));
      }
    },
  });

  return (
    <>
      <Button
        size="sm-to-md"
        isPending={
          isSaving || (opening.isPending && !isDisabled && openingId === id)
        }
        ref={attach}
        onPress={() => {
          if (isDisabled) return;

          failure.close();
          const target = { id };
          setOpeningId(id);
          request.current = target;
          opening.mutate(target);
        }}
      >
        <Icon name="pencil" />
        {t("imageDetail.edit")}
      </Button>
      {editing !== undefined && (
        <EditImageDialog
          key={editing.id}
          image={editing}
          onClose={() => {
            setEditing((current) =>
              current === editing ? undefined : current,
            );
          }}
        />
      )}
    </>
  );
};
