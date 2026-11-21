import { expect, test } from "bun:test";

import { chooseFirstListener } from "../choose-first-listener";

test.each([
  {
    title: "どちらも番号を決めた",
    external: 8787,
    internal: 8788,
    first: "internal",
  },
  {
    title: "外部用だけを OS に選ばせる",
    external: 0,
    internal: 8788,
    first: "internal",
  },
  {
    title: "内部用だけを OS に選ばせる",
    external: 8787,
    internal: 0,
    first: "external",
  },
  {
    title: "どちらも OS に選ばせる",
    external: 0,
    internal: 0,
    first: "internal",
  },
])(
  "$title ときは、$first を先に待ち受けること",
  ({ external, first, internal }) => {
    expect(chooseFirstListener({ external, internal })).toBe(first);
  },
);
