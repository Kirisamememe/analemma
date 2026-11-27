import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { fieldDefinitions } from "@analemma/contract";

import { useKindDefinition } from "../use-kind-definition";

import { createTestApp } from "@/testing/create-test-app";
import { createFixedPageRoutes } from "@/testing/fake-routes/create-fixed-page-routes";
import { kind } from "@/testing/fixed-page-samples";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const counted = {
  ...kind,
  fields: fieldDefinitions.parse([
    { type: "number", key: "count", label: "件数" },
  ]),
};

const setUp = async () => {
  const server = createFixedPageRoutes({ kinds: [counted], pages: [] });
  const app = createTestApp({ path: "/enroll", routes: server.routes });
  await app.router.load();

  return { app, wrapper: withAppProviders(app) };
};

test("名前が分かるまでは取得せず、分かったら種類の定義を読む", async () => {
  const { app, wrapper } = await setUp();

  const { result, rerender } = renderHook(
    (name: string | undefined) => useKindDefinition(name),
    { initialProps: undefined, wrapper },
  );

  expect(app.calls).not.toContain("admin/kinds/get");
  rerender(kind.name);
  await waitFor(() => {
    expect(result.current).toMatchObject({
      _tag: "Loaded",
      data: { _tag: "Succeeded", data: { name: kind.name } },
    });
  });
});

test("保存済みの中身を表せる定義はタブの中で使い回し、表せない値を持つページでは取り直す", async () => {
  const { app, wrapper } = await setUp();

  const definitionCalls = () =>
    app.calls.filter((path) => path === "admin/kinds/get").length;

  const first = renderHook(() => useKindDefinition(kind.name, { count: 1 }), {
    wrapper,
  });

  await waitFor(() => {
    expect(first.result.current._tag).toBe("Loaded");
  });

  const same = renderHook(() => useKindDefinition(kind.name, { count: 2 }), {
    wrapper,
  });

  expect(same.result.current._tag).toBe("Loaded");
  expect(definitionCalls()).toBe(1);
  renderHook(() => useKindDefinition(kind.name, { count: "多い" }), {
    wrapper,
  });
  await waitFor(() => {
    expect(definitionCalls()).toBe(2);
  });
});
