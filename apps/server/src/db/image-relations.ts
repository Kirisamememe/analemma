import { defineRelations } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { imageTag, imageTagAssignment } from "@/db/schema/image-tags";

/** 管理画面の画像と、その配信用の画像・タグの関係。 */
export const imageRelations = defineRelations(
  { image, deliveryImage, imageTag, imageTagAssignment },
  (r) => ({
    image: {
      deliveryImages: r.many.deliveryImage({
        from: r.image.id,
        to: r.deliveryImage.imageId,
      }),
      tags: r.many.imageTag({
        from: r.image.id.through(r.imageTagAssignment.imageId),
        to: r.imageTag.id.through(r.imageTagAssignment.tagId),
      }),
    },
  }),
);
