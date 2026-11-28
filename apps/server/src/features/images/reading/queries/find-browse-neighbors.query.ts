import { and, eq, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { image } from "@/db/schema/image";
import {
  matchImageTags,
  orderImages,
  seekImages,
} from "@/features/images/reading/queries/image-list.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 一覧の順で隣り合う画像を、対象の画像と同じ時点で読む。 */
export const findBrowseNeighbors = async (
  db: DatabaseExecutor,
  input: ContractInputs["admin"]["images"]["browseNeighbors"],
) => {
  const matches = matchImageTags(db, input);

  const current = db.$with("current_image").as(
    db
      .select({
        id: image.id,
        title: image.title,
        matches: (matches ?? sql`true`).as("matches"),
      })
      .from(image)
      .where(eq(image.id, input.id)),
  );

  const neighbor = (direction: "before" | "after") =>
    db
      .select({ id: image.id })
      .from(image)
      .where(
        and(matches, seekImages({ order: input.order, direction }, current)),
      )
      .orderBy(...orderImages(input.order, direction))
      .limit(1)
      .as(direction);

  const previous = neighbor("before");
  const next = neighbor("after");

  const [row] = await db
    .with(current)
    .select({ previous: previous.id, next: next.id })
    .from(current)
    .leftJoinLateral(previous, sql`${current.matches}`)
    .leftJoinLateral(next, sql`${current.matches}`);

  return row;
};
