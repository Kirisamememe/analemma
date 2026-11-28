import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";

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
    renderWithI18n(
      <Button pendingLabel="処理中" isPending>
        保存
      </Button>,
    );

    expect(screen.getByRole("button", { name: /保存/v })).toBeDefined();
    expect(screen.getByRole("progressbar", { name: "処理中" })).toBeDefined();
  });

  test("送信中になっても、文言を残し、ボタンの名前を変えない", () => {
    const { rerender } = renderWithI18n(<Button>保存</Button>);
    const idle = screen.getByRole("button", { name: "保存" }).textContent;

    rerender(
      <Button pendingLabel="処理中" isPending>
        保存
      </Button>,
    );

    expect(screen.getByRole("button", { name: "保存" }).textContent).toBe(idle);
  });

  test("送信中でなければ、待っていることを伝えない", () => {
    renderWithI18n(<Button>保存</Button>);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  test("送信中は、押しても onPress を呼ばない", async () => {
    const counter = countPresses();

    renderWithI18n(
      <Button pendingLabel="処理中" isPending onPress={counter.onPress}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(counter.count()).toBe(0);
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

  test("アクセシブルな名前を渡すと、文言の代わりにその名前で探せる", () => {
    renderWithI18n(<Button aria-label="リンク 2 を上へ">上へ</Button>);

    expect(
      screen.getByRole("button", { name: "リンク 2 を上へ" }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "上へ" })).toBeNull();
  });

  test("アイコンだけのボタンは、文言を出さず、アクセシブルな名前で探せる", () => {
    renderWithI18n(<Button aria-label="固定ページを削除" icon="trash-2" />);

    expect(
      screen.getByRole("button", { name: "固定ページを削除" }).textContent,
    ).toBe("");
  });
});
