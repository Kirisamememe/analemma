import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { DialogActions, DialogFooter } from "../dialog-footer";

afterEach(cleanup);

test("左右に補足と操作を置けて、どちらも空ならフッターを表示しない", () => {
  const action = (
    <DialogActions>
      <button type="button">保存</button>
    </DialogActions>
  );

  const { rerender } = render(<DialogFooter start={0} end={action} />);
  expect(screen.getByText("0")).toBeDefined();
  expect(screen.getByRole("button", { name: "保存" })).toBeDefined();
  rerender(<DialogFooter start={action} end="保存済み" />);
  expect(screen.getByText("保存済み")).toBeDefined();
  expect(screen.getByRole("button", { name: "保存" })).toBeDefined();
  rerender(<DialogFooter start={null} end={false} />);
  expect(screen.queryByRole("contentinfo")).toBeNull();
});
