import { and, eq, ne, sql } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";
import type { FixedPageRow } from "../find-fixed-page.query";

/** 保存する固定ページの値。 */
export type FixedPageSave = {
  /** 書き換える固定ページの ID か、新しいページを表す undefined。 */
  readonly id: string | undefined;
  /** 種類の名前(新しく作るときだけ使う)。 */
  readonly kind: string;
  /** slug。 */
  readonly slug: string;
  /** タイトル。 */
  readonly title: string;
  /** 種類の定義で検査した中身。 */
  readonly content: Record<string, unknown>;
  /** 保存した日時。 */
  readonly now: Date;
};

/** 保存した固定ページの行。 */
export type SavedFixedPage = {
  /** どの結果か。 */
  readonly _tag: "Saved";
  /** 保存した行。 */
  readonly row: FixedPageRow;
};

/** slug が、ほかの固定ページに使われていること。 */
export type SlugTaken = {
  /** どの結果か。 */
  readonly _tag: "SlugTaken";
};

/** すでにある固定ページの保存。 */
type ExistingPageSave = FixedPageSave & {
  /** 書き換える固定ページの ID。 */
  readonly id: string;
};

const SLUG_TAKEN: SlugTaken = { _tag: "SlugTaken" };

const isSlugTaken = async (
  db: DatabaseExecutor,
  { id, slug }: FixedPageSave,
): Promise<boolean> => {
  const rows = await db
    .select({ id: fixedPage.id })
    .from(fixedPage)
    .where(
      id === undefined
        ? eq(fixedPage.slug, slug)
        : and(eq(fixedPage.slug, slug), ne(fixedPage.id, id)),
    );

  return rows.length > 0;
};

const insertPage = async (
  db: DatabaseExecutor,
  { content, kind, now, slug, title }: FixedPageSave,
): Promise<FixedPageRow | undefined> => {
  const [row] = await db
    .insert(fixedPage)
    .values({
      kind,
      slug,
      title,
      content,
      position: sql`(select coalesce(max(${fixedPage.position}), -1) + 1 from ${fixedPage})`,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: fixedPage.slug })
    .returning();

  return row;
};

const updatePage = async (
  db: DatabaseExecutor,
  { content, id, now, slug, title }: ExistingPageSave,
): Promise<FixedPageRow> => {
  const [row] = await db
    .update(fixedPage)
    .set({
      slug,
      title,
      content,
      updatedAt: sql`case
        when ${fixedPage.slug} is distinct from ${slug}
          or ${fixedPage.title} is distinct from ${title}
          or ${fixedPage.content} is distinct from ${JSON.stringify(content)}::text::jsonb
        then ${now}::timestamptz
        else ${fixedPage.updatedAt}
      end`,
    })
    .where(eq(fixedPage.id, id))
    .returning();

  if (row === undefined) {
    throw new Error("ロックした固定ページの行を書き換えられなかった");
  }

  return row;
};

/** 固定ページの中身を書く、ただ1つの関数。 */
export const saveFixedPage = async (
  db: DatabaseExecutor,
  save: FixedPageSave,
): Promise<SavedFixedPage | SlugTaken> => {
  if (await isSlugTaken(db, save)) {
    return SLUG_TAKEN;
  }

  if (save.id !== undefined) {
    return {
      _tag: "Saved",
      row: await updatePage(db, { ...save, id: save.id }),
    };
  }

  const row = await insertPage(db, save);

  return row === undefined ? SLUG_TAKEN : { _tag: "Saved", row };
};
