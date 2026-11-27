import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { Announcement } from "../announcement";

afterEach(cleanup);

test("文言を、読み上げに伝える欄(status)に置く", () => {
  render(<Announcement>変換が終わりました</Announcement>);

  expect(screen.getByRole("status").textContent).toBe("変換が終わりました");
});

test("同じ文言でも、回が替われば、伝える要素を作り直す", () => {
  const { rerender } = render(
    <Announcement revision={1}>「無題」の変換が終わりました</Announcement>,
  );

  const first = screen.getByText("「無題」の変換が終わりました");

  rerender(
    <Announcement revision={2}>「無題」の変換が終わりました</Announcement>,
  );

  expect(screen.getByText("「無題」の変換が終わりました")).not.toBe(first);
  expect(first.isConnected).toBe(false);
});
