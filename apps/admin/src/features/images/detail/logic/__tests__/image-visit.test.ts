import { describe, expect, test } from "bun:test";

import type { AdminImage } from "../../queries/image-query";
import {
  followVisit,
  type ImageVisit,
  settleVisit,
  visitPhotos,
} from "../image-visit";

const image = (id: string, withPhoto = true): AdminImage => ({
  id,
  title: null,
  description: null,
  alt: null,
  takenAt: null,
  takenAtOffset: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
  published: true,
  publishedAt: "2026-01-01T00:00:00.000Z",
  deliveryImages: withPhoto
    ? [{ width: 640, height: 480, url: `/media/${id}/640.avif` }]
    : [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const b = image("b");
const c = image("c");

describe("followVisit", () => {
  test("最初に取得した写真は、待たずに表示する", () => {
    expect(followVisit({ id: "b" }, { id: "b", latest: b })).toEqual({
      id: "b",
      shown: b,
      latest: b,
    });
  });

  test("次の写真(ID が小さい方)へ移ると、前の写真を残したまま向きを記録する", () => {
    const visit = followVisit(
      { id: "b", shown: b, latest: b },
      { id: "a", latest: undefined },
    );

    expect(visit).toEqual({ id: "a", direction: "next", shown: b });
    expect(followVisit(visit, { id: "a", latest: undefined })).toBe(visit);
  });

  test("移った先の写真が届いても、読み込み終えるまでは前の写真を表示する", () => {
    const visit = followVisit(
      { id: "b", shown: b, latest: b },
      { id: "c", latest: c },
    );

    expect(visit).toEqual({
      id: "c",
      direction: "previous",
      shown: b,
      latest: c,
    });
    expect(settleVisit(visit, "c").shown).toBe(c);
  });

  test("配信用の画像が無い写真は、読み込みを待たずに表示する", () => {
    const empty = image("c", false);

    expect(
      followVisit({ id: "b", shown: b }, { id: "c", latest: empty }).shown,
    ).toBe(empty);
  });

  test("表示中の写真を書き換えた結果が届いたら、すぐに替える", () => {
    const renamed = { ...b, title: "稜線" };

    expect(
      followVisit(
        { id: "b", shown: b, latest: b },
        { id: "b", latest: renamed },
      ).shown,
    ).toBe(renamed);
  });
});

describe("settleVisit", () => {
  test("先に開いた写真が後から読み込み終えても、今の写真を上書きしない", () => {
    const visit: ImageVisit = { id: "c", shown: b, latest: c };

    expect(settleVisit(visit, "a")).toBe(visit);
  });
});

describe("visitPhotos", () => {
  test("読み込みを待つ写真を、表示中の写真と分ける", () => {
    expect(
      visitPhotos({ id: "c", shown: b }, { status: "Loaded", latest: c }),
    ).toEqual({ shown: b, pending: c });
  });

  test("取得中は表示中の写真を残し、待つ写真は無い", () => {
    expect(
      visitPhotos(
        { id: "c", shown: b },
        { status: "Loading", latest: undefined },
      ),
    ).toEqual({ shown: b, pending: undefined });
  });

  test("移った先の画像が無ければ、前の写真を表示しない", () => {
    expect(
      visitPhotos(
        { id: "c", shown: b },
        { status: "Loaded", latest: undefined },
      ).shown,
    ).toBeUndefined();
  });

  test("同じ写真の取り直しに失敗しても表示を残し、移った先の失敗では残さない", () => {
    const failed = { status: "Failed", latest: undefined } as const;

    expect(visitPhotos({ id: "b", shown: b }, failed).shown).toBe(b);
    expect(visitPhotos({ id: "c", shown: b }, failed).shown).toBeUndefined();
  });
});
