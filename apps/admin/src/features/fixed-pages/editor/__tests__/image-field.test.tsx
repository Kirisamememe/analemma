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

import { fieldDefinitions } from "@analemma/contract";

import * as groups from "../../ui/content-group";
import { ImageField } from "../image-field";

import type { FakeRoutes } from "@/testing/create-fake-api";
import { createTestApp } from "@/testing/create-test-app";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";
import { renderApp } from "@/testing/render-app";
import { SAMPLE_IMAGES } from "@/testing/sample-photos";
import * as inputs from "@/ui/primitives/form-fields";

afterEach(cleanup);

const library = createImageRoutes(SAMPLE_IMAGES);
const portrait = { type: "image", key: "portrait", label: "肖像" };

const fields = fieldDefinitions.parse([
  { type: "text", key: "caption", label: "説明" },
  { type: "group", key: "profile", label: "紹介", fields: [portrait] },
  {
    type: "repeat",
    key: "rows",
    label: "行",
    fields: [{ ...portrait, optional: true }],
  },
]);

const missing = "019affff-0000-7000-8000-0000000000ff";
const harbor = library.images().find(({ title }) => title === "港の灯り");

if (harbor === undefined) throw new Error("画像がありません");

const content = {
  caption: "写真",
  profile: {},
  rows: [{ portrait: harbor.id }, { portrait: missing }],
};

const edit = (routes: FakeRoutes = {}) =>
  renderApp({
    path: "/fixed-pages/" + page.id,
    routes: {
      ...library.routes,
      "admin/kinds/get": () => ({ output: { ...kind, fields } }),
      "admin/fixedPages/get": () => ({ output: { ...page, content } }),
      ...routes,
    },
  });

const save = async () => {
  const [button] = screen.getAllByRole("button", { name: "保存" });

  if (button === undefined) throw new Error("保存のボタンがありません");

  await userEvent.click(button);
};

const pickRidge = async (
  trigger: HTMLElement,
  action: "選択を確定" | "キャンセル",
) => {
  await userEvent.click(trigger);
  await userEvent.click(
    await screen.findByRole("radio", { name: /夕暮れの稜線/v }),
  );
  await userEvent.click(screen.getByRole("button", { name: action }));
};

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
    edit({
      "admin/fixedPages/update": () => ({
        error: "INVALID_CONTENT",
        data: {
          issues: [
            {
              path: ["profile", "portrait"],
              code: "invalid_type",
              message: "",
            },
          ],
        },
      }),
    });
    await screen.findByText("画像がありません");
    await screen.findByText("港の灯り");

    const target = scenario === "repeat の画像" ? "行 2" : "紹介";
    const section = within(screen.getByRole("group", { name: target }));

    const trigger = section.getByRole("button", {
      name: scenario === "repeat の画像" ? "替える" : "画像を選ぶ",
    });

    if (scenario === "必須の誤り") {
      await save();
      expect(section.getByText("必須")).toBeDefined();
      await section.findByRole("button", {
        name: "画像を選ぶ",
        description: "入力してください。",
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
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
      expect(section.queryByRole("button", { name: "外す" })).toBeNull();
    }

    await userEvent.click(
      screen.getByRole("link", { name: "固定ページの一覧" }),
    );
    await screen.findByRole("dialog", { name: "保存していない変更があります" });
  },
);

test("非公開と削除済みの画像を保って保存でき、取り替え・取り消し・取り外しを反映する", async () => {
  const saved = { ...content, profile: { portrait: missing } };
  let sent: unknown;
  edit({
    "admin/fixedPages/get": () => ({ output: { ...page, content: saved } }),
    "admin/fixedPages/update": (input) => {
      sent = input.content;
      return { output: { ...page, ...input } };
    },
  });
  const first = within(await screen.findByRole("group", { name: "行 1" }));
  const second = within(screen.getByRole("group", { name: "行 2" }));
  await first.findByText("非公開");
  await second.findByText("画像がありません");
  await save();
  await screen.findByText("固定ページを更新しました。");
  expect(sent).toEqual(saved);
  await userEvent.keyboard("{Escape}");
  await pickRidge(second.getByRole("button", { name: "替える" }), "キャンセル");
  expect(second.getByText("画像がありません")).toBeDefined();
  await pickRidge(second.getByRole("button", { name: "替える" }), "選択を確定");
  expect(
    (await second.findByRole("img", { name: /夕日の残る空/v })).getAttribute(
      "src",
    ),
  ).toContain("dusk-ridge");
  await userEvent.click(first.getByRole("button", { name: "外す" }));
  await save();
  await waitFor(() => {
    expect(sent).toEqual({
      ...saved,
      rows: [{}, { portrait: library.images()[0]?.id }],
    });
  });
});

test("取得に失敗した画像はその場で読み直し、公開中の画像を表示する", async () => {
  const server = createImageRoutes([{ title: "海" }]);
  server.replyNext("admin/images/get", () => ({
    error: "INTERNAL_SERVER_ERROR",
    defined: false,
  }));
  const app = createTestApp({ path: "/", routes: server.routes });
  app.queryClient.setDefaultOptions({ queries: { retry: false } });
  await app.router.load();
  render(
    <ImageField
      value={server.images()[0]?.id ?? null}
      label="表紙"
      required={false}
      error={undefined}
      onChange={() => undefined}
    />,
    { wrapper: withAppProviders(app) },
  );
  await screen.findByText("画像を読み込めませんでした");
  expect(screen.queryByText("画像がありません")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
  await screen.findByText("海");
  expect(screen.queryByText("非公開")).toBeNull();
});
