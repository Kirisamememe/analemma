import { cleanup, getRoles, render } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { GroupMarker } from "../group-marker";

afterEach(cleanup);

test.each([
  { kind: "group", inGroup: true },
  { kind: "repeat", inGroup: false },
] as const)(
  "$kind の印は飾りなので、親の group の中($inGroup)でも、読み上げの対象に何も足さない",
  ({ kind, inGroup }) => {
    const { container } = render(
      <GroupMarker kind={kind} inGroup={inGroup} invalid={false} />,
    );

    expect(Object.values(getRoles(container)).flat()).toEqual([container]); // 描いた先の枠だけ
    expect(container.textContent).toBe("");
  },
);
