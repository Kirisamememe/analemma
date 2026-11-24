import type { ReactNode } from "react";

import { useDropboxImport } from "@/features/dropbox/hooks/use-dropbox-import";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";
import { Notice } from "@/ui/primitives/notice";

/** 取り込みの進み具合と、取り込む操作。 */
export const ImportSummary = (): ReactNode => {
  const t = useTranslate();
  const state = useDropboxImport();
  const { counts, running, importable, batch, importedCount, failure } = state;

  const summary =
    counts === undefined
      ? t("dropbox.photosSummary", {
          importable: importable.length,
          imported: importedCount,
        })
      : running
        ? t("dropbox.progress", counts)
        : counts.failed === 0
          ? t("dropbox.done", counts)
          : t("dropbox.doneWithFailures", counts);

  return (
    <Stack gap={3}>
      <Cluster align="center" gap={3} justify="between">
        <Text tone="muted">
          <output>{summary}</output>
        </Text>
        <Cluster gap={2}>
          <Button isDisabled={running} onPress={state.reload}>
            {t("dropbox.reload")}
          </Button>
          <Button
            isDisabled={batch.length === 0 || running}
            isPending={state.starting}
            onPress={state.start}
            tone="primary"
          >
            {running
              ? t("dropbox.importing")
              : batch.length === 0
                ? t("dropbox.importNone")
                : t("dropbox.import", { count: batch.length })}
          </Button>
        </Cluster>
      </Cluster>
      {failure !== undefined && (
        <Notice tone="warning">{t(`dropbox.startFailure.${failure}`)}</Notice>
      )}
    </Stack>
  );
};
