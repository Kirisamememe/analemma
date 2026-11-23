import { describe, expect, test } from "bun:test";

import { checkAfterSubmit } from "@/components/forms/logic/check-after-submit";

const validate = checkAfterSubmit((value: string) =>
  value === "" ? "名前を入力してください" : undefined,
);

const props = (value: string, submissionAttempts: number) => ({
  value,
  fieldApi: { form: { state: { submissionAttempts } } },
});

describe("checkAfterSubmit", () => {
  test("一度も送っていなければ、合わない値でも誤りを出さない", () => {
    expect(validate(props("", 0))).toBeUndefined();
  });

  test("送った後は、値を確かめた結果を返す", () => {
    expect(validate(props("", 1))).toBe("名前を入力してください");
    expect(validate(props("MacBook", 1))).toBeUndefined();
  });
});
