import { describe, expect, test } from "bun:test";

import { decideSession } from "@/features/auth/session/decide-session";

const LOGIN = new Date("2026-01-01T00:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const at = (ms: number): Date => new Date(LOGIN.getTime() + ms);

describe("セッションの期限", () => {
  test("ログインの直後は、使わないまま7日で切れる期限を返し、書き直さないこと", () => {
    expect(
      decideSession({ createdAt: LOGIN, lastUsedAt: LOGIN }, LOGIN),
    ).toEqual({
      _tag: "Active",
      expiresAt: at(7 * DAY),
      refresh: false,
    });
  });

  test("最後に書き直してから1時間たつまでは、書き直さないこと", () => {
    expect(
      decideSession({ createdAt: LOGIN, lastUsedAt: LOGIN }, at(HOUR - 1)),
    ).toEqual({ _tag: "Active", expiresAt: at(7 * DAY), refresh: false });
  });

  test("1時間たったら、使った日時から7日に延ばして書き直すこと", () => {
    expect(
      decideSession({ createdAt: LOGIN, lastUsedAt: LOGIN }, at(HOUR)),
    ).toEqual({ _tag: "Active", expiresAt: at(HOUR + 7 * DAY), refresh: true });
  });

  test("使わないまま7日たったら、切れること", () => {
    expect(
      decideSession({ createdAt: LOGIN, lastUsedAt: LOGIN }, at(7 * DAY - 1)),
    ).toMatchObject({ _tag: "Active", refresh: true });
    expect(
      decideSession({ createdAt: LOGIN, lastUsedAt: LOGIN }, at(7 * DAY)),
    ).toEqual({ _tag: "Expired" });
  });

  test("使い続けても、ログインから30日で切れること", () => {
    const times = { createdAt: LOGIN, lastUsedAt: at(29 * DAY) };

    expect(decideSession(times, at(29 * DAY + 2 * HOUR))).toEqual({
      _tag: "Active",
      expiresAt: at(30 * DAY),
      refresh: true,
    });
    expect(decideSession(times, at(30 * DAY))).toEqual({ _tag: "Expired" });
  });
});
