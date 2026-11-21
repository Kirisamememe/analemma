import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { Button } from "../button";

afterEach(cleanup);

/** ボタンを押した回数を数えるもの。 */
type PressCounter = {
  /** 押した回数。 */
  readonly count: () => number;
  /** onPress に渡す関数。 */
  readonly onPress: () => void;
};

const countPresses = (): PressCounter => {
  let presses = 0;

  return {
    count: () => presses,
    onPress: () => {
      presses += 1;
    },
  };
};

describe("Button", () => {
  test("押すと onPress を呼ぶ", async () => {
    const counter = countPresses();

    render(<Button onPress={counter.onPress}>保存</Button>);
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(1);
  });

  test("送信中は、押しても onPress を呼ばない", async () => {
    const counter = countPresses();

    render(
      <Button isPending onPress={counter.onPress}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(0);
  });

  test("押せないときは、押しても onPress を呼ばない", async () => {
    const counter = countPresses();

    render(
      <Button isDisabled onPress={counter.onPress}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(0);
  });
});
