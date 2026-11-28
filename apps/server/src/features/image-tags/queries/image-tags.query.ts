import { eq, ne, and, max, notExists, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { imageTag, imageTagAssignment } from "@/db/schema/image-tags";
import type { Database, DatabaseExecutor } from "@/platform/database";

const summary = { id: imageTag.id, name: imageTag.name };

const lockCatalog = (db: DatabaseExecutor) =>
  db.execute(sql`lock table ${imageTag} in share row exclusive mode`);

/** 新しいタグを末尾に追加する。 */
export const appendTag = (db: Database, name: string) =>
  db.transaction(async (tx) => {
    await lockCatalog(tx);

    const [row] = await tx
      .insert(imageTag)
      .values({
        name,
        position: sql`(select coalesce(${max(imageTag.position)}, -1) + 1 from ${imageTag})`,
      })
      .onConflictDoNothing({ target: imageTag.name })
      .returning(summary);

    return row;
  });

/** 同じ名前のタグがなければ名前を変更する。 */
export const renameTag = (
  db: Database,
  { id, name }: ContractInputs["admin"]["imageTags"]["rename"],
) =>
  db.transaction(async (tx) => {
    await lockCatalog(tx);

    const duplicate = tx
      .select({ id: imageTag.id })
      .from(imageTag)
      .where(and(ne(imageTag.id, id), eq(imageTag.name, name)));

    const [row] = await tx
      .update(imageTag)
      .set({ name })
      .where(and(eq(imageTag.id, id), notExists(duplicate)))
      .returning(summary);

    if (!row) {
      const exists = await tx.$count(imageTag, eq(imageTag.id, id));
      return exists
        ? ({ _tag: "NameTaken" } as const)
        : ({ _tag: "Missing" } as const);
    }

    return { _tag: "Renamed", row } as const;
  });

/** すべてのタグを一度ずつ含む並びを保存する。 */
export const reorderTags = (db: Database, requested: readonly string[]) =>
  db.transaction(async (tx) => {
    await lockCatalog(tx);
    const existing = await tx.select({ id: imageTag.id }).from(imageTag);
    const ids = new Set(requested.map((id) => id.toLowerCase()));

    if (
      existing.length !== requested.length ||
      !existing.every(({ id }) => ids.has(id))
    ) {
      return false;
    }

    await tx.execute(sql`
      update ${imageTag} set position = ordered.position - 1
      from jsonb_array_elements_text(${JSON.stringify(requested)}::text::jsonb) with ordinality as ordered(id, position)
      where ${imageTag.id} = ordered.id::uuid
    `);

    return true;
  });

/** 画像に付いていないタグを消す。 */
export const deleteUnusedTag = (db: Database, id: string) =>
  db.transaction(async (tx) => {
    await lockCatalog(tx);

    const [row] = await tx
      .select({ id: imageTag.id })
      .from(imageTag)
      .where(eq(imageTag.id, id))
      .for("update");

    if (!row) return { _tag: "Missing" } as const;

    const [assignment] = await tx
      .select({ id: imageTagAssignment.imageId })
      .from(imageTagAssignment)
      .where(eq(imageTagAssignment.tagId, id))
      .limit(1);

    if (assignment) return { _tag: "InUse" } as const;

    await tx.delete(imageTag).where(eq(imageTag.id, id));

    return { _tag: "Deleted" } as const;
  });
