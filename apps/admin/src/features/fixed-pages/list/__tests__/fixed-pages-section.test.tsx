import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import {
  createFixedPageRoutes,
  type FakeFixedPageState,
} from "@/testing/fake-routes/create-fixed-page-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const KINDS = [{ name: "page", label: "基本のページ", fields: [] }];

const STATE: FakeFixedPageState = {
  kinds: KINDS,
  pages: [
    { kind: "page", slug: "about", title: "About", published: true },
    { kind: "page", slug: "colophon", title: "Colophon" },
    { kind: "legacy", slug: "contact", title: "連絡先" },
  ],
};

const setUp = (state: FakeFixedPageState = STATE) => {
  const server = createFixedPageRoutes(state);
  const app = renderApp({ path: "/fixed-pages", routes: server.routes });

  return { server, ...app };
};

const rowNames = (): string[] =>
  screen.getAllByRole("row").map((row) => row.getAttribute("aria-label") ?? "");

const findRow = async (name: string): Promise<HTMLElement> =>
  screen.findByRole("row", { name });

const dragDown = async (name: string, steps: number): Promise<void> => {
  const user = userEvent.setup();

  await user.click(await findRow(name));
  await user.keyboard("{Tab}{Enter}");
  await user.keyboard("{ArrowDown}".repeat(steps));
  await user.keyboard("{Enter}");
};

describe("FixedPagesSection", () => {
  test("並び順のまま、タイトル・公開状態・slug・種類のラベル・更新日時を出す", async () => {
    setUp();

    const about = await findRow("About");

    expect(rowNames()).toEqual(["About", "Colophon", "連絡先"]);
    expect(within(about).getByText("公開中")).toBeDefined();
    expect(within(about).getByText(/^about・基本のページ・.+ に更新$/v));
    expect(within(await findRow("Colophon")).getByText("非公開")).toBeDefined();
    expect(
      within(await findRow("連絡先")).getByText(/^contact・legacy・/v),
    ).toBeDefined();
  });

  test("固定ページが無ければ、まだ無いことを出す", async () => {
    setUp({ kinds: KINDS, pages: [] });

    expect(
      await screen.findByRole("heading", {
        name: "固定ページはまだありません",
      }),
    ).toBeDefined();
    expect(screen.queryByRole("grid")).toBeNull();
  });

  test("一覧を読み込めなければ、知らせる", async () => {
    const server = createFixedPageRoutes(STATE);

    renderApp({
      path: "/fixed-pages",
      routes: {
        ...server.routes,
        "admin/fixedPages/list": () => ({
          error: "INTERNAL_SERVER_ERROR",
          defined: false,
        }),
      },
    });

    expect(
      await screen.findByText(
        "固定ページを読み込めませんでした。",
        {},
        { timeout: 5000 },
      ),
    ).toBeDefined();
  });

  test("公開と非公開を切り替え、結果を Toast で知らせる", async () => {
    const { server } = setUp();

    await userEvent.click(
      within(await findRow("Colophon")).getByRole("button", {
        name: "公開する",
      }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「Colophon」を公開しました。",
    );
    expect(
      within(await findRow("Colophon")).getByRole("button", {
        name: "非公開にする",
      }),
    ).toBeDefined();
    expect(server.pages().map(({ published }) => published)).toEqual([
      true,
      true,
      false,
    ]);
  });

  test("ほかで消えたページの公開を切り替えると、一覧を読み直して知らせる", async () => {
    const { server } = setUp();
    const about = await findRow("About");
    const [page] = server.pages();

    server.routes["admin/fixedPages/delete"]({ id: page?.id ?? "" });
    await userEvent.click(
      within(about).getByRole("button", { name: "非公開にする" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「About」はもうありません。一覧を読み込み直しました。",
    );
    expect(rowNames()).toEqual(["Colophon", "連絡先"]);
  });

  test("公開状態を変えられなければ、Toast で知らせる", async () => {
    const { server } = setUp();

    server.replyNext("admin/fixedPages/unpublish", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    await userEvent.click(
      within(await findRow("About")).getByRole("button", {
        name: "非公開にする",
      }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「About」の公開状態を変えられませんでした。もう一度試してください。",
    );
  });

  test("取っ手をキーボードで動かすと、全部の ID を並べた順に送る", async () => {
    const { server, calls } = setUp();

    await dragDown("About", 1);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "並び順を保存しました。",
    );
    expect(rowNames()).toEqual(["Colophon", "About", "連絡先"]);
    expect(server.pages().map(({ slug }) => slug)).toEqual([
      "colophon",
      "about",
      "contact",
    ]);
    expect(calls).toContain("admin/fixedPages/reorder");
  });

  test("送っている間は、動かした順に並べ、保存していることを示す", async () => {
    const { server } = setUp();
    const reply =
      Promise.withResolvers<FakeReply<"admin/fixedPages/reorder">>();

    server.replyNext("admin/fixedPages/reorder", () => reply.promise);
    await dragDown("About", 2);

    expect(await screen.findByText("並び順を保存しています")).toBeDefined();
    expect(rowNames()).toEqual(["Colophon", "連絡先", "About"]);

    const [about, colophon, contact] = server.pages().map(({ id }) => id);

    reply.resolve(
      server.routes["admin/fixedPages/reorder"]({
        ids: [colophon ?? "", contact ?? "", about ?? ""],
      }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "並び順を保存しました。",
    );
    expect(screen.queryByText("並び順を保存しています")).toBeNull();
  });

  test("ほかでページが増えていたら、一覧を読み直して知らせる", async () => {
    const { server } = setUp();

    await findRow("About");
    server.routes["admin/fixedPages/create"]({
      kind: "page",
      slug: "privacy",
      title: "プライバシー",
      content: {},
    });
    await dragDown("About", 1);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "ほかで固定ページが増えたか減ったため、並び順を保存できませんでした。一覧を読み込み直したので、もう一度並べ直してください。",
    );
    expect(rowNames()).toEqual(["About", "Colophon", "連絡先", "プライバシー"]);
  });

  test("並び順を保存できなければ、元の並びに戻して知らせる", async () => {
    const { server } = setUp();

    server.replyNext("admin/fixedPages/reorder", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
    await dragDown("About", 1);

    expect((await screen.findByRole("alert")).textContent).toBe(
      "並び順を保存できませんでした。もう一度試してください。",
    );
    expect(rowNames()).toEqual(["About", "Colophon", "連絡先"]);
  });
});
