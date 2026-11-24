import { type ReactNode, useId } from "react";

import { useSeriesForm, type SeriesFormProps } from "./hooks/use-series-form";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Dialog } from "@/ui/primitives/overlays";

/** 名前・slug・説明を入力してシリーズを保存する。 */
export const SeriesForm = (props: SeriesFormProps): ReactNode => {
  const t = useTranslate();
  const descriptionId = useId();

  const {
    form,
    isPending,
    confirmClose,
    exitDialog,
    refusedErrors,
    focusRefusedSlug,
    clearRefused,
    validators,
    requestClose,
    stay,
    leave,
  } = useSeriesForm(props);

  return (
    <>
      <Dialog
        isOpen
        isPending={isPending}
        status={isPending ? "pending" : undefined}
        title={t(
          isPending
            ? "series.saving"
            : props.series === undefined
              ? "series.new"
              : "series.edit",
        )}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        {!isPending && (
          <form.AppForm>
            <form.Form isPending={isPending} validationErrors={refusedErrors}>
              <form.AppField name="name" validators={validators("name")}>
                {(field) => (
                  <field.TextField isRequired label={t("series.name")} />
                )}
              </form.AppField>
              <form.AppField
                name="slug"
                listeners={{ onChange: clearRefused }}
                validators={validators("slug")}
              >
                {(field) => (
                  <field.TextField
                    inputRef={focusRefusedSlug}
                    isRequired
                    label={t("fixedPageEditor.slug")}
                    description={t("fixedPageEditor.slugHint")}
                  />
                )}
              </form.AppField>
              <form.AppField
                name="description"
                validators={validators("description")}
              >
                {(field) => (
                  <field.TextArea label={t("imageDetail.description")} />
                )}
              </form.AppField>
              <Cluster gap={2}>
                <Button onPress={requestClose}>
                  {t("imageDetail.cancel")}
                </Button>
                <Button type="submit" tone="primary" isPending={isPending}>
                  {t("fixedPageEditor.save")}
                </Button>
              </Cluster>
            </form.Form>
          </form.AppForm>
        )}
      </Dialog>
      <Dialog
        isOpen={confirmClose}
        title={t(exitDialog.title)}
        descriptionId={descriptionId}
        onOpenChange={(open) => {
          if (!open) stay();
        }}
      >
        <Text>
          <span id={descriptionId}>{t(exitDialog.description)}</span>
        </Text>
        <Cluster gap={2} justify="end">
          <Button onPress={stay}>{t(exitDialog.stay)}</Button>
          <Button tone={exitDialog.tone} onPress={leave}>
            {t(exitDialog.leave)}
          </Button>
        </Cluster>
      </Dialog>
    </>
  );
};
