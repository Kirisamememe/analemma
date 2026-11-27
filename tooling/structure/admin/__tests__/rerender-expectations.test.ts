import { expect, test } from "bun:test";

import {
  RERENDER_HEADING,
  findMissingRerenderExpectations,
} from "../rerender-expectations";

const STATEFUL = 'import { useState } from "react";';
const STATELESS = 'import { type ReactNode, useCallback } from "react";';

const decisions = (path: string, body: string) => ({
  path,
  text: `# 決めたこと\n\n${RERENDER_HEADING}\n\n${body}\n\n## 割り切ったこと\n`,
});

test("state を持つ feature の DECISIONS.md に見出しが無ければ、そのフォルダを返すこと", () => {
  expect(
    findMissingRerenderExpectations({
      sources: [
        { path: "apps/admin/src/features/images/list.tsx", text: STATEFUL },
      ],
      documents: [
        {
          path: "apps/admin/src/features/images/DECISIONS.md",
          text: "# 決めたこと\n\n## 割り切ったこと\n",
        },
      ],
    }),
  ).toEqual(["apps/admin/src/features/images/"]);
});

test("見出しの下に何も書いていなければ、そのフォルダを返すこと", () => {
  expect(
    findMissingRerenderExpectations({
      sources: [
        { path: "apps/admin/src/features/images/list.tsx", text: STATEFUL },
      ],
      documents: [decisions("apps/admin/src/features/images/DECISIONS.md", "")],
    }),
  ).toEqual(["apps/admin/src/features/images/"]);
});

test("見出しの下に期待を書いた feature は返さないこと", () => {
  expect(
    findMissingRerenderExpectations({
      sources: [
        {
          path: "apps/admin/src/features/images/upload/hooks/use-uploads.ts",
          text: 'import { useReducer } from "react";',
        },
      ],
      documents: [
        decisions(
          "apps/admin/src/features/images/DECISIONS.md",
          "- 入力では一覧を再レンダリングしない。",
        ),
      ],
    }),
  ).toEqual([]);
});

test("DECISIONS.md の無いフォルダは、管理画面の DECISIONS.md の見出しの下にパスが無ければ返すこと", () => {
  const sources = [
    { path: "apps/admin/src/features/passkeys/section.tsx", text: STATEFUL },
    {
      path: "apps/admin/src/routes/images/use-image-visit.ts",
      text: 'import { useSyncExternalStore } from "react";',
    },
  ];

  expect(
    findMissingRerenderExpectations({
      sources,
      documents: [
        decisions(
          "apps/admin/DECISIONS.md",
          "- `src/routes/images/`:写真を替えたときだけ state が変わる。",
        ),
      ],
    }),
  ).toEqual(["apps/admin/src/features/passkeys/"]);
});

test("state を持たないフォルダと、テストと story だけが state を持つフォルダは返さないこと", () => {
  expect(
    findMissingRerenderExpectations({
      sources: [
        { path: "apps/admin/src/features/auth/gate.tsx", text: STATELESS },
        {
          path: "apps/admin/src/components/forms/__stories__/form.stories.tsx",
          text: STATEFUL,
        },
        {
          path: "apps/admin/src/features/session/__tests__/log-out.test.tsx",
          text: STATEFUL,
        },
        { path: "apps/admin/src/routes/home-page.tsx", text: STATEFUL },
        { path: "apps/admin/src/ui/primitives/button.tsx", text: STATEFUL },
      ],
      documents: [],
    }),
  ).toEqual([]);
});
