import { expect, test } from "bun:test";

import { nextPhotoLoad, PHOTO_LOADING } from "../photo-load";

test("読み込めなかった写真を読み込み直すと、試行を数えてから、届いた結果に替える", () => {
  const failed = nextPhotoLoad(PHOTO_LOADING, "error");
  const retrying = nextPhotoLoad(failed, "retry");

  expect(failed).toEqual({ status: "failed", attempt: 0 });
  expect(retrying).toEqual({ status: "retrying", attempt: 1 });
  expect(nextPhotoLoad(retrying, "load")).toEqual({
    status: "loaded",
    attempt: 1,
  });
  expect(nextPhotoLoad(nextPhotoLoad(retrying, "error"), "retry")).toEqual({
    status: "retrying",
    attempt: 2,
  });
});
