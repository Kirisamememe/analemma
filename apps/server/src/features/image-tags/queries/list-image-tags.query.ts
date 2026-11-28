import { desc, eq, sql } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { imageTag, imageTagAssignment } from "@/db/schema/image-tags";
import type { DatabaseExecutor } from "@/platform/database";

/** タグごとの使用枚数と、配信用の画像がある新しい2枚の最小幅を読む。 */
export const listTagRows = (db: DatabaseExecutor) => {
  const smallest = db
    .select({ width: deliveryImage.width })
    .from(deliveryImage)
    .where(eq(deliveryImage.imageId, imageTagAssignment.imageId))
    .orderBy(deliveryImage.width)
    .limit(1)
    .as("smallest");

  const assigned = eq(imageTagAssignment.tagId, imageTag.id);

  const recent = db
    .select({ imageId: imageTagAssignment.imageId, width: smallest.width })
    .from(imageTagAssignment)
    .innerJoinLateral(smallest, sql`true`)
    .where(assigned)
    .orderBy(desc(imageTagAssignment.imageId))
    .limit(2)
    .as("recent");

  return db
    .select({
      id: imageTag.id,
      name: imageTag.name,
      imageCount: db.$count(imageTagAssignment, assigned),
      imageId: recent.imageId,
      width: recent.width,
    })
    .from(imageTag)
    .leftJoinLateral(recent, sql`true`)
    .orderBy(imageTag.position, desc(recent.imageId));
};
