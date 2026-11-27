import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, spyOn, test } from "bun:test";
import { Profiler } from "react";

import { fieldDefinitions } from "@analemma/contract";

import * as groups from "../../ui/content-group";

import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind, page } from "@/testing/fixed-page-samples";
import { renderApp } from "@/testing/render-app";
import * as inputs from "@/ui/primitives/form-fields";

afterEach(cleanup);

const fields = fieldDefinitions.parse([
  { type: "text", key: "caption", label: "説明" },
  {
    type: "repeat",
    key: "rows",
    label: "行",
    fields: [{ type: "text", key: "body", label: "本文" }],
  },
]);

const UNRELATED = ["slug", "タイトル", "説明", "行 2"];

test("repeat の要素に文字を入力しても、ほかの入力欄とほかの要素を再レンダリングしない", async () => {
  const counts = new Map<string, number>();

  const count = (id: string) => {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  };

  const { TextField } = inputs;
  using textFields = spyOn(inputs, "TextField").mockImplementation((props) => (
    <Profiler id={props.label} onRender={count}>
      {TextField(props)}
    </Profiler>
  ));
  const { ContentGroup } = groups;
  using rows = spyOn(groups, "ContentGroup").mockImplementation((props) => (
    <Profiler id={props.label} onRender={count}>
      {ContentGroup(props)}
    </Profiler>
  ));

  const server = createFixedPageRoutes({
    kinds: [{ name: kind.name, label: kind.label, fields }],
    pages: [
      {
        ...page,
        content: { caption: "写真", rows: [{ body: "1" }, { body: "2" }] },
      },
    ],
  });

  const [stored] = server.pages();

  if (stored === undefined) throw new Error("固定ページがありません");

  renderApp({ path: "/fixed-pages/" + stored.id, routes: server.routes });

  const first = within(await screen.findByRole("group", { name: "行 1" }));
  const body = first.getByRole("textbox", { name: "本文" });
  const unrelated = () => UNRELATED.map((label) => counts.get(label) ?? 0);
  const before = unrelated();
  const typed = counts.get("本文") ?? 0;

  expect(textFields).toHaveBeenCalled();
  expect(rows).toHaveBeenCalled();
  expect(before.every((commits) => commits > 0)).toBe(true);

  await userEvent.type(body, "山");
  expect(screen.getByDisplayValue("1山")).toBe(body);
  expect(counts.get("本文") ?? 0).toBeGreaterThan(typed);
  expect(unrelated()).toEqual(before);

  await userEvent.type(body, "川");
  expect(screen.getByDisplayValue("1山川")).toBe(body);
  expect(unrelated()).toEqual(before);
});
