import { and, eq } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { imageTag, imageTagAssignment } from "@/db/schema/image-tags";
import { lockImage } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

type TagChange = ContractInputs["admin"]["images"]["addTag"] & {
  /** タグを付けるか外すか。 */
  readonly change: "add" | "remove";
};

/** 画像とタグの削除を待たせて、両方があれば付け外しを行う。 */
export const changeImageTag = async (
  tx: DatabaseExecutor,
  { id, tagId, change }: TagChange,
) => {
  if (!(await lockImage(tx, id))) return false;

  const [tag] = await tx
    .select({ id: imageTag.id })
    .from(imageTag)
    .where(eq(imageTag.id, tagId))
    .for("key share");

  if (!tag) return false;

  if (change === "add") {
    await tx
      .insert(imageTagAssignment)
      .values({ imageId: id, tagId })
      .onConflictDoNothing();
  } else {
    await tx
      .delete(imageTagAssignment)
      .where(
        and(
          eq(imageTagAssignment.imageId, id),
          eq(imageTagAssignment.tagId, tagId),
        ),
      );
  }

  return true;
};
