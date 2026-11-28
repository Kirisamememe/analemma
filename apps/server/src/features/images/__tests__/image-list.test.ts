import { describe, expect, test } from "bun:test";

import type { ContractOutputs } from "@analemma/contract";

import { imageTagAssignment } from "@/db/schema/image-tags";
import {
  catchErrorCode,
  createTestClient,
  insertImages,
  openTestDatabase,
  signInAsAdmin,
} from "@/test-client";

type Page = ContractOutputs["admin"]["images"]["list"];
const ids = (page: Page) => page.images.map(({ id }) => id);

describe("画像一覧の絞り込みと並び順", () => {
  test("複数のタグのいずれか、すべて、タグ無しで全ページの画像を絞り込めること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const [none = "", mountain = "", evening = "", both = ""] =
      await insertImages(server, [
        { title: "タグ無し" },
        { title: "山" },
        { title: "夕方" },
        { title: "夕方の山" },
      ]);

    await using connection = openTestDatabase(server);

    const { create } = server.client.admin.imageTags;
    const peak = await create({ name: "山" });
    const dusk = await create({ name: "夕方" });

    await connection.db.insert(imageTagAssignment).values([
      { imageId: mountain, tagId: peak.id },
      { imageId: evening, tagId: dusk.id },
      { imageId: both, tagId: peak.id },
      { imageId: both, tagId: dusk.id },
    ]);

    const list = server.client.admin.images.list;
    const tags = [peak.id, dusk.id];

    const first = await list({ tags, limit: 1 });
    expect(ids(first)).toEqual([both]);
    expect(ids(await list({ tags, cursor: first.nextCursor ?? "" }))).toEqual([
      evening,
      mountain,
    ]);
    expect(ids(await list({ tags, match: "all" }))).toEqual([both]);
    expect(
      ids(await list({ tags: [peak.id, peak.id.toUpperCase()], match: "all" })),
    ).toEqual([both, mountain]);
    expect(ids(await list({ tags: "untagged" }))).toEqual([none]);
    expect(ids(await list({ tags: [], match: "all" }))).toEqual([
      both,
      evening,
      mountain,
      none,
    ]);
  });

  test("タイトル中の数字を数値として比べ、等しいタイトルと「無題」は追加順を保ち、cursor の画像を消しても続きを読めること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const titles = ["写真10", "写真2", "写真02", "無題", null, "写真:1"];

    const [
      ten = "",
      two = "",
      padded = "",
      named = "",
      untitled = "",
      colon = "",
    ] = await insertImages(
      server,
      titles.map((title) => ({ title })),
    );

    const { list, delete: remove } = server.client.admin.images;
    const first = await list({ order: "title", limit: 1 });
    expect(ids(first)).toEqual([colon]);

    await remove({ id: colon });

    const second = await list({
      order: "title",
      cursor: first.nextCursor ?? "",
      limit: 1,
    });

    expect(ids(second)).toEqual([padded]);

    const third = await list({
      order: "title",
      cursor: second.nextCursor ?? "",
      limit: 3,
    });

    expect(ids(third)).toEqual([two, ten, untitled]);

    const last = await list({ order: "title", cursor: third.nextCursor ?? "" });
    expect(ids(last)).toEqual([named]);
    expect(last.nextCursor).toBeNull();
  });

  test("並び順に合わない cursor と不正なタグの ID は BAD_REQUEST で断ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const id = crypto.randomUUID();
    const list = server.client.admin.images.list;

    expect(await catchErrorCode(list({ order: "title", cursor: id }))).toBe(
      "BAD_REQUEST",
    );
    expect(await catchErrorCode(list({ cursor: `${id}:写真` }))).toBe(
      "BAD_REQUEST",
    );
    expect(
      await catchErrorCode(list({ order: "title", cursor: "a:写真" })),
    ).toBe("BAD_REQUEST");
    expect(await catchErrorCode(list({ tags: ["夕日"] }))).toBe("BAD_REQUEST");
  });
});
