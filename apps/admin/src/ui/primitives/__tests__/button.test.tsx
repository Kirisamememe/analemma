import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";
import { Form } from "@/ui/primitives/form";

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

    renderWithI18n(<Button onPress={counter.onPress}>保存</Button>);
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(1);
  });

  test("送信中は、ボタンの名前を残したまま、待っていることをスクリーンリーダーに伝える", () => {
    renderWithI18n(<Button isPending>保存</Button>);

    expect(screen.getByRole("button", { name: /保存/v })).toBeDefined();
    expect(screen.getByRole("progressbar", { name: "Working" })).toBeDefined();
  });

  test("送信中でなければ、待っていることを伝えない", () => {
    renderWithI18n(<Button>保存</Button>);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  test("送信中は、押しても onPress を呼ばない", async () => {
    const counter = countPresses();

    renderWithI18n(
      <Button isPending onPress={counter.onPress}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(0);
  });

  test("focus を受け取れる無効なボタンは、Tab で移れても Enter や Space で操作できない", async () => {
    const counter = countPresses();
    const user = userEvent.setup();
    const submits = countPresses();
    renderWithI18n(
      <Form onSubmit={submits.onPress}>
        <Button
          type="submit"
          isDisabled
          allowFocusWhenDisabled
          onPress={counter.onPress}
        >
          上へ
        </Button>
      </Form>,
    );
    const button = screen.getByRole("button", { name: "上へ" });
    await user.tab();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    await user.keyboard("{Enter} ");
    expect(counter.count()).toBe(0);
    expect(submits.count()).toBe(0);
  });

  test("押せないときは、押しても onPress を呼ばない", async () => {
    const counter = countPresses();

    renderWithI18n(
      <Button isDisabled onPress={counter.onPress}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(0);
  });
});
