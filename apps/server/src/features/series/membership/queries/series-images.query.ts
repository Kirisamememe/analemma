import { and, eq, inArray, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { image } from "@/db/schema/image";
import { series, seriesImage } from "@/db/schema/series";
import type { DatabaseExecutor } from "@/platform/database";

type Selection = ContractInputs["admin"]["series"]["addImages"];

/** 画像の並びを変えるシリーズの行のロック。 */
export const lockSeries = async (db: DatabaseExecutor, id: string) => {
  const rows = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.id, id))
    .for("no key update");

  return rows.length > 0;
};

/** シリーズの末尾に画像を足す。 */
export const appendImages = async (
  db: DatabaseExecutor,
  { id, imageIds: requested }: Selection,
) => {
  const ids = [...new Set(requested.map((value) => value.toLowerCase()))];

  const rows = await db
    .select({ id: image.id })
    .from(image)
    .where(inArray(image.id, ids))
    .orderBy(image.id)
    .for("key share");

  if (rows.length !== ids.length) return false;

  await db.execute(sql`
    insert into ${seriesImage} (series_id, image_id, position)
    select ${id}::uuid, ordered.id::uuid,
      (select coalesce(max(position), -1) from ${seriesImage} where series_id = ${id}::uuid)
      + row_number() over (order by ordered.position)
    from jsonb_array_elements_text(${JSON.stringify(ids)}::text::jsonb) with ordinality as ordered(id, position)
    where not exists (select 1 from ${seriesImage} where series_id = ${id}::uuid and image_id = ordered.id::uuid)
  `);

  return true;
};

/** シリーズから指定した画像を外す。 */
export const removeImages = async (
  db: DatabaseExecutor,
  { id, imageIds: ids }: Selection,
) =>
  db
    .delete(seriesImage)
    .where(
      and(eq(seriesImage.seriesId, id), inArray(seriesImage.imageId, ids)),
    );

/** シリーズの画像の位置を振り直す。 */
export const reorderImages = async (
  db: DatabaseExecutor,
  { id, imageIds: requested }: Selection,
) => {
  const rows = await db
    .select({ id: seriesImage.imageId })
    .from(seriesImage)
    .where(eq(seriesImage.seriesId, id))
    .orderBy(seriesImage.imageId)
    .for("update");

  const ids = new Set(requested.map((value) => value.toLowerCase()));

  if (
    rows.length !== requested.length ||
    !rows.every((row) => ids.has(row.id))
  ) {
    return false;
  }

  await db.execute(sql`
    update ${seriesImage} set position = ordered.position - 1
    from jsonb_array_elements_text(${JSON.stringify(requested)}::text::jsonb) with ordinality as ordered(id, position)
    where ${seriesImage.seriesId} = ${id}::uuid and ${seriesImage.imageId} = ordered.id::uuid
  `);

  return true;
};
