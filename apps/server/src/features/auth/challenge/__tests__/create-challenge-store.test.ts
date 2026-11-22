import { describe, expect, test } from "bun:test";

import { createChallengeStore } from "@/features/auth/challenge/create-challenge-store";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const LOGIN = { kind: "login" } as const;

const later = (ms: number): Date => new Date(NOW.getTime() + ms);

describe("challenge の表", () => {
  test("出した challenge を、同じ用途で1回だけ取り出せること", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const challenge = store.issue(LOGIN, NOW);
    const taken = store.take(challenge, { purpose: LOGIN, now: NOW });

    expect(taken).toEqual({
      _tag: "Taken",
      challenge: Uint8Array.fromBase64(challenge, { alphabet: "base64url" }),
    });
    expect(store.take(challenge, { purpose: LOGIN, now: NOW })).toEqual({
      _tag: "Missing",
    });
  });

  test("32 バイトの乱数を、padding の無い base64url で返すこと", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const challenges = Array.from({ length: 5 }, () => store.issue(LOGIN, NOW));

    for (const challenge of challenges) {
      expect(challenge).toMatch(/^[A-Za-z0-9_\-]{43}$/v);
    }

    expect(new Set(challenges).size).toBe(5);
  });

  test("寿命を過ぎた challenge は取り出せず、表からも消えること", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const challenge = store.issue(LOGIN, NOW);

    expect(store.take(challenge, { purpose: LOGIN, now: later(1000) })).toEqual(
      {
        _tag: "Missing",
      },
    );
    expect(store.take(challenge, { purpose: LOGIN, now: NOW })).toEqual({
      _tag: "Missing",
    });
  });

  test("用途が違えば取り出せず、その challenge は使い切られること", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const enrollment = { kind: "enrollment", enrollmentId: "a" } as const;
    const challenge = store.issue(enrollment, NOW);

    expect(
      store.take(challenge, {
        purpose: { kind: "enrollment", enrollmentId: "b" },
        now: NOW,
      }),
    ).toEqual({ _tag: "Missing" });
    expect(store.take(challenge, { purpose: enrollment, now: NOW })).toEqual({
      _tag: "Missing",
    });
  });

  test("ログイン・登録用 URL・パスキーの追加の用途を、取り違えないこと", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const addition = { kind: "addition", sessionId: "s" } as const;

    for (const wrong of [
      LOGIN,
      { kind: "enrollment", enrollmentId: "s" } as const,
    ]) {
      const challenge = store.issue(addition, NOW);

      expect(store.take(challenge, { purpose: wrong, now: NOW })).toEqual({
        _tag: "Missing",
      });
    }
  });

  test("満杯なら、古いものから捨てて新しい challenge を出すこと", () => {
    const store = createChallengeStore({ capacity: 2, lifetimeMs: 1000 });
    const first = store.issue(LOGIN, NOW);
    const second = store.issue(LOGIN, NOW);
    const third = store.issue(LOGIN, NOW);

    expect(store.take(first, { purpose: LOGIN, now: NOW })._tag).toBe(
      "Missing",
    );
    expect(store.take(second, { purpose: LOGIN, now: NOW })._tag).toBe("Taken");
    expect(store.take(third, { purpose: LOGIN, now: NOW })._tag).toBe("Taken");
  });

  test("同じバイト列に戻る、正規でない base64url の書き方では取り出せないこと", () => {
    const store = createChallengeStore({ capacity: 10, lifetimeMs: 1000 });
    const challenge = store.issue(LOGIN, NOW);

    expect(store.take(`${challenge}=`, { purpose: LOGIN, now: NOW })._tag).toBe(
      "Missing",
    );
    expect(store.take(challenge, { purpose: LOGIN, now: NOW })._tag).toBe(
      "Taken",
    );
  });
});
