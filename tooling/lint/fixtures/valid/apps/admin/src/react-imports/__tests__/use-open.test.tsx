import { render, screen } from "@testing-library/react";
import { expect, test } from "bun:test";

import { useOpen } from "../use-open";

const OpenLabel = () => {
  const [isOpen] = useOpen();

  return <p>{isOpen ? "開いている" : "閉じている"}</p>;
};

test("最初は閉じていること", () => {
  render(<OpenLabel />);

  expect(screen.getByText("閉じている")).toBeDefined();
});
