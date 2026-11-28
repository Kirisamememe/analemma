import {
  type SQL,
  type SQLWrapper,
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  gt,
  inArray,
  lt,
  notExists,
  sql,
} from "drizzle-orm";

import { type ContractInputs, readImageCursor } from "@analemma/contract";

import { image } from "@/db/schema/image";
import { imageTagAssignment } from "@/db/schema/image-tags";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

type ListInput = ContractInputs["admin"]["images"]["list"];
type Order = ListInput["order"];
type Direction = "before" | "after";

type OrderedDirection = {
  /** 一覧の並び順。 */
  readonly order: Order;
  /** 基準から画像を探す向き。 */
  readonly direction: Direction;
};

type PageRange = ListInput & {
  /** 一覧で読む画像の数。 */
  readonly limit: number;
};

type Anchor = {
  /** 並びの基準になる画像の ID。 */
  readonly id: string | SQLWrapper;
  /** 並びの基準になる画像のタイトル。 */
  readonly title: string | null | SQLWrapper;
};

/** タグの条件に合う画像を選ぶ SQL の条件。 */
export const matchImageTags = (
  db: DatabaseExecutor,
  { tags, match }: Pick<ListInput, "tags" | "match">,
): SQL | undefined => {
  if (tags === undefined || tags.length === 0) return undefined;

  const assigned = db
    .select({ id: imageTagAssignment.imageId })
    .from(imageTagAssignment);

  const sameImage = eq(imageTagAssignment.imageId, image.id);

  if (tags === "untagged") return notExists(assigned.where(sameImage));

  const selected = assigned.where(
    and(sameImage, inArray(imageTagAssignment.tagId, tags)),
  );

  return match === "all" && tags.length > 1
    ? exists(
        selected
          .groupBy(imageTagAssignment.imageId)
          .having(eq(count(), tags.length)),
      )
    : exists(selected);
};

const titleKey = (title: Anchor["title"]): SQL =>
  sql`coalesce(${title}::text, '無題') collate "image_title_ja"`;

/** 一覧を指定した向きに読むときの並び順。 */
export const orderImages = (order: Order, direction: Direction): SQL[] => {
  const byId = direction === "after" ? desc(image.id) : asc(image.id);

  if (order !== "title") return [byId];

  const title = titleKey(image.title);

  return [direction === "after" ? asc(title) : desc(title), byId];
};

/** 基準の画像の手前または先にある画像を選ぶ SQL の条件。 */
export const seekImages = (
  { order, direction }: OrderedDirection,
  anchor: Anchor,
): SQL => {
  const after = direction === "after";
  const byId = after ? lt(image.id, anchor.id) : gt(image.id, anchor.id);

  if (order !== "title") return byId;

  const title = titleKey(image.title);
  const boundary = titleKey(anchor.title);
  const byTitle = after ? gt(title, boundary) : lt(title, boundary);

  return sql`(${byTitle} or (${eq(title, boundary)} and ${byId}))`;
};

/** タグの条件に合う画像を cursor の先から指定した件数だけ読む。 */
export const listImageRows = (
  db: DatabaseExecutor,
  input: PageRange,
): Promise<ImageRow[]> =>
  db
    .select()
    .from(image)
    .where(
      and(
        matchImageTags(db, input),
        input.cursor === undefined
          ? undefined
          : seekImages(
              { order: input.order, direction: "after" },
              readImageCursor(input.cursor),
            ),
      ),
    )
    .orderBy(...orderImages(input.order, "after"))
    .limit(input.limit);
