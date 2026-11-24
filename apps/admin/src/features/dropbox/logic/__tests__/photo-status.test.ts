import { describe, expect, test } from "bun:test";

import { toStatusView } from "@/features/dropbox/logic/photo-status";

describe("toStatusView", () => {
  test("取り込んでいる写真だけを処理の途中とし、取り込めなかった写真を危険の色にすること", () => {
    expect(toStatusView("importing")).toEqual({ tone: "info", busy: true });
    expect(toStatusView("waiting")).toEqual({ tone: "neutral", busy: false });
    expect(toStatusView("added").tone).toBe("success");
    expect(toStatusView("not-found").tone).toBe("warning");
    expect(
      (["too-large", "unsupported", "failed"] as const).map(
        (status) => toStatusView(status).tone,
      ),
    ).toEqual(["danger", "danger", "danger"]);
  });
});
