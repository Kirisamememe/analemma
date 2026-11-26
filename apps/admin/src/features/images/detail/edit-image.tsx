import { type ReactNode, useId } from "react";

import { useImageTextEditor } from "./hooks/use-image-text-editor";
import { useOpenImageEditor } from "./hooks/use-open-image-editor";
import { imageTextFields } from "./logic/image-text";
import type { AdminImage } from "./queries/image-query";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { Dialog } from "@/ui/primitives/overlays";

/** 画像のタイトル・説明・alt を編集する Dialog に渡す値。 */
type EditImageDialogProps = {
  /** 編集する画像。 */
  image: AdminImage;
  /** 閉じる関数。 */
  onClose: () => void;
};

const EditImageDialog = ({
  image,
  onClose,
}: EditImageDialogProps): ReactNode => {
  const t = useTranslate();
  const descriptionId = useId();

  const { form, isSaving, confirmation, check, requestClose, stay, leave } =
    useImageTextEditor(image, onClose);

  const { messages } = confirmation;

  return (
    <>
      <Dialog
        isOpen
        isPending={isSaving}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={t("imageDetail.editTitle")}
      >
        <form.AppForm>
          <form.Form isPending={isSaving}>
            {imageTextFields.map((name) => (
              <form.AppField
                key={name}
                name={name}
                validators={{ onChange: check(name) }}
              >
                {(field) =>
                  name === "description" ? (
                    <field.TextArea
                      isReadOnly={isSaving}
                      label={t("imageDetail.description")}
                    />
                  ) : (
                    <field.TextField
                      autoComplete="off"
                      description={
                        name === "alt" ? t("imageDetail.altHint") : undefined
                      }
                      isReadOnly={isSaving}
                      label={t(`imageDetail.${name}`)}
                    />
                  )
                }
              </form.AppField>
            ))}
            <Cluster gap={2} justify="end">
              <Button isDisabled={isSaving} onPress={requestClose}>
                {t("imageDetail.cancel")}
              </Button>
              <Button isPending={isSaving} tone="primary" type="submit">
                {t("imageDetail.save")}
              </Button>
            </Cluster>
          </form.Form>
        </form.AppForm>
      </Dialog>
      <Dialog
        isOpen={confirmation.isOpen}
        descriptionId={descriptionId}
        title={t(messages.title)}
        onOpenChange={(open) => {
          if (!open) stay();
        }}
      >
        <Text>
          <span id={descriptionId}>{t(messages.description)}</span>
        </Text>
        <Cluster gap={2} justify="end">
          <Button onPress={stay}>{t(messages.stay)}</Button>
          <Button
            tone={confirmation.whileSaving ? "secondary" : "danger"}
            onPress={leave}
          >
            {t(messages.leave)}
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
  image: AdminImage;
};

/** 押すとタイトル・説明・alt を編集する Dialog を開く。 */
export const EditImage = ({
  image,
  isDisabled = false,
}: EditImageProps): ReactNode => {
  const t = useTranslate();

  const { editing, isPending, attach, open, close } = useOpenImageEditor(
    image.id,
    isDisabled,
  );

  return (
    <>
      <Button size="sm-to-md" isPending={isPending} ref={attach} onPress={open}>
        <Icon name="pencil" />
        {t("imageDetail.edit")}
      </Button>
      {editing !== undefined && (
        <EditImageDialog
          key={editing.id}
          image={editing}
          onClose={() => {
            close(editing);
          }}
        />
      )}
    </>
  );
};
