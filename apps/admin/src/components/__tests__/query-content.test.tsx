import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { QueryContent } from "@/components/query-content";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

const renderContent = (
  query: Parameters<typeof QueryContent<string[]>>[0]["query"],
) =>
  renderWithI18n(
    <QueryContent
      failedTitle="一覧を読み込めませんでした"
      level={3}
      loading="list"
      query={query}
    >
      {(names) => <p>{names.join("・")}</p>}
    </QueryContent>,
    "ja",
  );

describe("QueryContent", () => {
  test("読み込み中は、中身の代わりに読み込んでいることを伝える", async () => {
    renderContent({ _tag: "Loading" });

    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    expect(status.contains(await screen.findByText("読み込んでいます"))).toBe(
      true,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("読み込めなかったら、何を読み込めなかったかを伝え、その場で取り直せる", async () => {
    const retry = mock(() => undefined);

    renderContent({ _tag: "Failed", isRetrying: false, retry });

    expect(screen.getByRole("alert").textContent).toContain(
      "一覧を読み込めませんでした",
    );
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test("読み込めたら、データから中身を描く", () => {
    renderContent({ _tag: "Loaded", data: ["MacBook", "iPhone"] });

    expect(screen.getByText("MacBook・iPhone")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
