import { render, screen } from "@testing-library/react";
import { expect, test } from "bun:test";

import { useToggle } from "../use-toggle";

const ToggleLabel = () => {
  const [isOn] = useToggle();

  return <p>{isOn ? "入" : "切"}</p>;
};

test("最初は切れていること", () => {
  render(<ToggleLabel />);

  expect(screen.getByText("切")).toBeDefined();
});
