import { toDropboxImport } from "@/features/dropbox/importing/import-run";
import { adminProcedures } from "@/procedures";

/** 最後に始めた取り込みの進み具合を返す procedure。 */
export const getDropboxImport = adminProcedures.dropbox.getImport.handler(
  ({ context }) => {
    const run = context.dropbox.imports.current();

    return run === undefined ? null : toDropboxImport(run);
  },
);
