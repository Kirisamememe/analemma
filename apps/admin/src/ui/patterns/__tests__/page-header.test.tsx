import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { Button } from "../../primitives/button";
import { PageHeader } from "../page-header";

afterEach(cleanup);

describe("PageHeader", () => {
  test("画面の名前を1段目の見出しにし、補足と操作を並べる", () => {
    render(
      <PageHeader
        actions={<Button>新しいページ</Button>}
        description="公開サイトの固定ページ"
        title="固定ページ"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "固定ページ" }),
    ).toBeDefined();
    expect(screen.getByText("公開サイトの固定ページ")).toBeDefined();
    expect(screen.getByRole("button", { name: "新しいページ" })).toBeDefined();
  });

  test("条件で出さない操作(false)と空の補足は、無いものとして扱う", () => {
    render(<PageHeader actions={false} description="" title="固定ページ" />);

    expect(screen.queryByRole("paragraph")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("補足と操作が無ければ、見出しだけを出す", () => {
    render(<PageHeader title="固定ページ" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "固定ページ",
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("paragraph")).toBeNull();
  });
});
