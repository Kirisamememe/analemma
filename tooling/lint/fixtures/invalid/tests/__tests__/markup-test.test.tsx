import { render, screen } from "@testing-library/react";
import { expect, test } from "bun:test";

test("見出しを描画すること", () => {
  const { container } = render(
    <h1 className="title" data-testid="title">
      題
    </h1>,
  );

  expect(screen.getByTestId("title")).toHaveClass("title");
  expect(container.querySelector("h1")?.className).toBe("title");
  expect(container).toMatchSnapshot();
});
