import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Profiler } from "react";

import { fieldDefinitions, type FixedPageContent } from "@analemma/contract";

import * as groups from "../../ui/content-group";
import { ImageField } from "../image-field";

import { createTestApp } from "@/testing/create-test-app";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";
import { renderApp } from "@/testing/render-app";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
import * as inputs from "@/ui/primitives/form-fields";

afterEach(cleanup);

// --------------------
// 編集画面の見本と操作
// --------------------

const library = createImageRoutes(SAMPLE_IMAGES);
const portrait = { type: "image", key: "portrait", label: "肖像" };

const fields = fieldDefinitions.parse([
  { type: "text", key: "caption", label: "説明" },
  {
    type: "group",
    key: "profile",
    label: "紹介",
    optional: true,
    fields: [
      portrait,
      { type: "text", key: "note", label: "補足", optional: true },
    ],
  },
  {
    type: "repeat",
    key: "rows",
    label: "行",
    fields: [{ ...portrait, optional: true }],
  },
]);

const missing = "019affff-0000-7000-8000-0000000000ff";

const imageId = (title: string) => {
  const image = library.images().find((photo) => photo.title === title);

  if (image === undefined) throw new Error(title);

  return image.id;
};

const content = {
  caption: "写真",
  profile: { note: "写真" },
  rows: [{ portrait: imageId("港の灯り") }, { portrait: missing }],
};

const edit = (saved: FixedPageContent = content) => {
  const server = createFixedPageRoutes({
    kinds: [{ name: kind.name, label: kind.label, fields }],
    pages: [{ ...page, content: saved }],
  });

  const [stored] = server.pages();

  if (stored === undefined) throw new Error("固定ページがありません");

  renderApp({
    path: "/fixed-pages/" + stored.id,
    routes: { ...library.routes, ...server.routes },
  });

  return server;
};

const button = (name: string) => screen.getByRole("button", { name });

const save = async () => {
  const [saveButton] = screen.getAllByRole("button", { name: "保存" });

  if (saveButton === undefined) throw new Error("保存のボタンがありません");

  await userEvent.click(saveButton);
};

const pickRidge = async (
  trigger: HTMLElement,
  action: "選択を確定" | "キャンセル",
) => {
  await userEvent.click(trigger);
  await userEvent.click(
    await screen.findByRole("radio", { name: /夕暮れの稜線/v }),
  );
  await userEvent.click(button(action));
};

// --------------------
// 画像の操作と保存
// --------------------

test.each(["group の未入力", "必須の誤り", "repeat の画像"])(
  "%sで画像を選んでも、ほかの入力欄と要素は描き直さない",
  async (scenario) => {
    const counts = new Map<string, number>();

    const count = (id: string) => {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    };

    const { TextField } = inputs;
    using textFields = spyOn(inputs, "TextField").mockImplementation(
      (props) => (
        <Profiler id={props.label} onRender={count}>
          {TextField(props)}
        </Profiler>
      ),
    );
    const { ContentGroup } = groups;
    using rows = spyOn(groups, "ContentGroup").mockImplementation((props) => (
      <Profiler id={props.label} onRender={count}>
        {ContentGroup(props)}
      </Profiler>
    ));
    edit();
    await screen.findByText("画像がありません");
    await screen.findByText("港の灯り");

    const target = scenario === "repeat の画像" ? "行 2" : "紹介";
    const section = within(screen.getByRole("group", { name: target }));

    const action = scenario === "repeat の画像" ? "替える" : "画像を選ぶ";
    const trigger = button(`${action}（${target} / 肖像）`);

    if (scenario === "必須の誤り") {
      const fieldset = section.getByRole("group", { name: /肖像/v });
      using scroll = spyOn(fieldset, "scrollIntoView");
      await save();
      expect(section.getByText("必須")).toBeDefined();
      await section.findByRole("button", {
        name: "画像を選ぶ（紹介 / 肖像）",
        description: "入力してください。",
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
        expect(scroll).toHaveBeenCalled();
      });
    }

    const siblings = () =>
      ["説明", "slug", "タイトル", "紹介", "行 1", "行 2"]
        .filter((label) => label !== target)
        .map((label) => counts.get(label) ?? 0);

    const before = siblings();
    expect(before.every((n) => n > 0)).toBe(true);
    const targetBefore = counts.get(target) ?? 0;
    await pickRidge(trigger, "選択を確定");
    await screen.findByText("夕暮れの稜線");
    expect(counts.get(target) ?? 0).toBeGreaterThan(targetBefore);
    expect(siblings()).toEqual(before);

    if (scenario === "必須の誤り") {
      expect(section.queryByText("入力してください。")).toBeNull();
      expect(section.queryByRole("button", { name: /外す/v })).toBeNull();
    }

    await userEvent.click(
      screen.getByRole("link", { name: "固定ページの一覧" }),
    );
    await screen.findByRole("dialog", { name: "保存していない変更があります" });
  },
);

test("非公開と削除済みの画像を保って保存でき、取り替え・取り消し・取り外しを反映する", async () => {
  const saved = { ...content, profile: { portrait: missing } };
  const server = edit(saved);
  const first = within(await screen.findByRole("group", { name: "行 1" }));
  const second = within(screen.getByRole("group", { name: "行 2" }));
  await first.findByText("非公開");
  await second.findByText("画像がありません");
  await save();
  await screen.findByText("固定ページを更新しました。");
  expect(server.pages()[0]?.content).toEqual(saved);
  await userEvent.keyboard("{Escape}");
  await pickRidge(button("替える（行 2 / 肖像）"), "キャンセル");
  expect(second.getByText("画像がありません")).toBeDefined();
  await pickRidge(button("替える（行 2 / 肖像）"), "選択を確定");
  const image = await second.findByRole("img", { name: /夕日の残る空/v });
  expect(image.getAttribute("src")).toContain("dusk-ridge");
  await userEvent.click(button("外す（行 1 / 肖像）"));
  await save();
  await waitFor(() => {
    expect(server.pages()[0]?.content).toEqual({
      ...saved,
      rows: [{}, { portrait: imageId("夕暮れの稜線") }],
    });
  });
});

test("必須画像の誤りが出た後、任意の group を空に戻して保存できる", async () => {
  const server = edit();
  const note = await screen.findByRole("textbox", { name: "補足" });
  await save();
  await screen.findByText("入力してください。");
  await userEvent.clear(note);
  await save();
  await screen.findByText("固定ページを更新しました。");
  expect(server.pages()[0]?.content).toEqual({
    caption: content.caption,
    rows: content.rows,
  });
});

test("画像の初回取得と再取得の失敗を欄で再試行し、最新の公開状態と focus を引き継ぐ", async () => {
  const server = createImageRoutes([{ title: "海" }]);

  const failNext = () => {
    server.replyNext("admin/images/get", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));
  };

  const app = createTestApp({ path: "/", routes: server.routes });
  app.queryClient.setDefaultOptions({ queries: { retry: false } });
  await app.router.load();
  const id = server.images()[0]?.id ?? "";

  const field = (label: string) => (
    <ImageField
      value={id}
      label={label}
      target={label}
      required={false}
      onChange={() => undefined}
    />
  );

  failNext();

  const { rerender } = render(<>{field("表紙")}</>, {
    wrapper: withAppProviders(app),
  });

  const retry = await screen.findByRole("button", { name: "もう一度試す" });
  expect(screen.queryByText("画像がありません")).toBeNull();
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.tab();
  expect(document.activeElement).toBe(retry);
  await userEvent.keyboard("{Enter}");
  await screen.findByText("海");
  expect(document.activeElement).toBe(button("替える（表紙）"));
  server.routes["admin/images/unpublish"]({ id });
  failNext();
  rerender(
    <>
      {field("表紙")}
      {field("挿絵")}
    </>,
  );
  await waitFor(() => {
    expect(screen.getAllByText("画像を読み込めませんでした")).toHaveLength(2);
  });
  expect(screen.queryByText("海")).toBeNull();
  await userEvent.click(
    within(screen.getByRole("group", { name: "挿絵" })).getByRole("button", {
      name: "もう一度試す",
    }),
  );
  await waitFor(() => {
    expect(screen.getAllByText("非公開")).toHaveLength(2);
  });
  expect(document.activeElement).toBe(button("替える（挿絵）"));
});
