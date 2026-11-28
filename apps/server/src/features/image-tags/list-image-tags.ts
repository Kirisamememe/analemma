import type { ContractOutputs } from "@analemma/contract";

import { listTagRows } from "@/features/image-tags/queries/list-image-tags.query";
import { toDeliveryImagePath } from "@/features/images/delivery/delivery-image-path";
import { adminProcedures } from "@/procedures";

type Tag = ContractOutputs["admin"]["imageTags"]["list"]["tags"][number];

/** 画像のタグを管理画面の並び順で返す procedure。 */
export const listImageTags = adminProcedures.imageTags.list.handler(
  async ({ context }) => {
    const tags = new Map<string, Tag>();

    for (const { id, name, imageCount, imageId, width } of await listTagRows(
      context.db,
    )) {
      let tag = tags.get(id);

      if (!tag) {
        tag = { id, name, imageCount, thumbnailUrls: [] };
        tags.set(id, tag);
      }

      if (imageId !== null && width !== null) {
        tag.thumbnailUrls.push(toDeliveryImagePath(imageId, width));
      }
    }

    return { tags: [...tags.values()] };
  },
);
