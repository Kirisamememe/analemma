import { PHOTO_MAX_BYTES } from "@analemma/contract";

import { toDropboxImport } from "@/features/dropbox/importing/import-run";
import { planImport } from "@/features/dropbox/importing/plan-import";
import { readFolderPhotos } from "@/features/dropbox/importing/read-folder-photos";
import { runDropboxImport } from "@/features/dropbox/importing/run-dropbox-import";
import { adminProcedures } from "@/procedures";

/** 選んだ写真を決め、リクエストの外で1枚ずつ取り込み始める procedure。 */
export const startDropboxImport = adminProcedures.dropbox.startImport.handler(
  async ({ context, errors, input, signal }) => {
    using claim = context.dropbox.imports.claim();

    if (claim === undefined) throw errors.IMPORT_RUNNING();

    const read = await readFolderPhotos(context, signal);

    if (read._tag === "NotConnected") throw errors.NOT_CONNECTED();

    if (read._tag === "ConnectionLost") throw errors.CONNECTION_LOST();

    const run = planImport({
      selected: input.photos,
      photos: read.photos,
      imported: new Map(
        [...read.imported].map(([hash, { imageId }]) => [hash, imageId]),
      ),
      maxBytes: PHOTO_MAX_BYTES,
      now: context.clock.now(),
    });

    signal?.throwIfAborted();

    const { clock, conversions, db, dropbox, logger, storage } = context;

    claim.begin(run, async () =>
      runDropboxImport({
        clock,
        conversions,
        db,
        dropbox,
        logger,
        storage,
        session: read.session,
      }),
    );

    logger.write({
      level: "info",
      message: "Dropbox からの取り込みを始めた",
      details: { photos: run.photos.length },
    });

    return toDropboxImport(run);
  },
);
