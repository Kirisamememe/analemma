import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { Announcement } from "../announcement";

afterEach(cleanup);

test("文言を、読み上げに伝える欄(status)に置く", () => {
  render(<Announcement>変換が終わりました</Announcement>);

  expect(screen.getByRole("status").textContent).toBe("変換が終わりました");
});
