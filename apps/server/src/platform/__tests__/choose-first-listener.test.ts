import { expect, test } from "bun:test";

import { chooseFirstListener } from "../choose-first-listener";

test.each([
  {
    title: "どちらのポートも番号を決めた",
    external: 8787,
    internal: 8788,
    first: "internal",
  },
  {
    title: "外部用のポートの番号だけを OS に選ばせる",
    external: 0,
    internal: 8788,
    first: "internal",
  },
  {
    title: "内部用のポートの番号だけを OS に選ばせる",
    external: 8787,
    internal: 0,
    first: "external",
  },
  {
    title: "どちらのポートの番号も OS に選ばせる",
    external: 0,
    internal: 0,
    first: "internal",
  },
])(
  "$title ときは、$first のポートで先に待ち受けること",
  ({ external, first, internal }) => {
    expect(chooseFirstListener({ external, internal })).toBe(first);
  },
);
