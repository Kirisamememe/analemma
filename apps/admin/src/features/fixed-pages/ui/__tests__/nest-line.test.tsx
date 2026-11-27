import { cleanup, getRoles, render } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { NestLine } from "../nest-line";

afterEach(cleanup);

test.each(["through", "lead", "elbowToAdd"] as const)(
  "線(%s)は飾りなので、読み上げの対象に何も足さない",
  (shape) => {
    const { container } = render(<NestLine shape={shape} />);

    expect(Object.values(getRoles(container)).flat()).toEqual([container]); // 描いた先の枠だけ
    expect(container.textContent).toBe("");
  },
);
