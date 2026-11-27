import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { ModalActions } from "../modal-actions";
import { ModalFooter } from "../modal-footer";

afterEach(cleanup);

test("左右に補足と操作を置けて、どちらも空なら landmark にしない", () => {
  const action = (
    <ModalActions>
      <button type="button">保存</button>
    </ModalActions>
  );

  const { rerender } = render(<ModalFooter start={0} end={action} />);
  expect(screen.getByText("0")).toBeDefined();
  expect(screen.getByRole("button", { name: "保存" })).toBeDefined();
  rerender(<ModalFooter start={action} end="保存済み" />);
  expect(screen.getByText("保存済み")).toBeDefined();
  expect(screen.getByRole("button", { name: "保存" })).toBeDefined();
  rerender(<ModalFooter start={[null, false]} end={[]} />);
  expect(screen.queryByRole("contentinfo")).toBeNull();
  rerender(<ModalFooter start={null} end={false} />);
  expect(screen.queryByRole("contentinfo")).toBeNull();
});
