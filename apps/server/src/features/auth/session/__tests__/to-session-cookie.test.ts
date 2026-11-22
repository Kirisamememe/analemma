import { expect, test } from "bun:test";

import { toSessionCookie } from "@/features/auth/session/to-session-cookie";

test("https の管理画面では、__Host- を付けた名前で Secure にすること", () => {
  expect(toSessionCookie("https://cms.example.com")).toEqual({
    name: "__Host-analemma_session",
    secure: true,
  });
});

test("開発の http の localhost では、__Host- も Secure も付けないこと", () => {
  expect(toSessionCookie("http://localhost:5173")).toEqual({
    name: "analemma_session",
    secure: false,
  });
});
