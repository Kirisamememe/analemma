import { and, eq, inArray, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { collection, collectionImage } from "@/db/schema/collection";
import { image } from "@/db/schema/image";
import type { DatabaseExecutor } from "@/platform/database";

type Selection = ContractInputs["admin"]["collections"]["addImages"];

/** 画像の並びを変える作品集の行のロック。 */
export const lockCollection = async (db: DatabaseExecutor, id: string) => {
  const rows = await db
    .select({ id: collection.id })
    .from(collection)
    .where(eq(collection.id, id))
    .for("no key update");

  return rows.length > 0;
};

/** 作品集の末尾に画像を足す。 */
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
    insert into ${collectionImage} (collection_id, image_id, position)
    select ${id}::uuid, ordered.id::uuid,
      (select coalesce(max(position), -1) from ${collectionImage} where collection_id = ${id}::uuid)
      + row_number() over (order by ordered.position)
    from jsonb_array_elements_text(${JSON.stringify(ids)}::text::jsonb) with ordinality as ordered(id, position)
    where not exists (select 1 from ${collectionImage} where collection_id = ${id}::uuid and image_id = ordered.id::uuid)
  `);

  return true;
};

/** 作品集から指定した画像を外す。 */
export const removeImages = async (
  db: DatabaseExecutor,
  { id, imageIds: ids }: Selection,
) =>
  db
    .delete(collectionImage)
    .where(
      and(
        eq(collectionImage.collectionId, id),
        inArray(collectionImage.imageId, ids),
      ),
    );

/** 作品集の画像の位置を振り直す。 */
export const reorderImages = async (
  db: DatabaseExecutor,
  { id, imageIds: requested }: Selection,
) => {
  const rows = await db
    .select({ id: collectionImage.imageId })
    .from(collectionImage)
    .where(eq(collectionImage.collectionId, id))
    .orderBy(collectionImage.imageId)
    .for("update");

  const ids = new Set(requested.map((value) => value.toLowerCase()));

  if (
    rows.length !== requested.length ||
    !rows.every((row) => ids.has(row.id))
  ) {
    return false;
  }

  await db.execute(sql`
    update ${collectionImage} set position = ordered.position - 1
    from jsonb_array_elements_text(${JSON.stringify(requested)}::text::jsonb) with ordinality as ordered(id, position)
    where ${collectionImage.collectionId} = ${id}::uuid and ${collectionImage.imageId} = ordered.id::uuid
  `);

  return true;
};
