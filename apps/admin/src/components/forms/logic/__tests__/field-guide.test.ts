import { expect, test } from "bun:test";

import { createFieldGuide } from "../field-guide";

import { createI18n } from "@/i18n/create-i18n";

const guide = createFieldGuide(createI18n("ja").t, "ja");

test("書式も文字数の制約もない欄では補足を省く", () => {
  expect(guide({ minLength: null, maxLength: null })).toBeUndefined();
});

test("空欄にできる欄では上限を案内し、必須の欄では下限も案内する", () => {
  const limits = { minLength: 1, maxLength: 200 };
  expect(guide(limits)).toBe("200文字まで");
  expect(guide(limits, { required: true })).toBe("1〜200文字");
});

test("下限だけがある欄と、書式だけがある欄を案内する", () => {
  const limits = { minLength: 2, maxLength: null };
  expect(guide(limits, { required: true })).toBe("2文字以上");
  expect(guide(limits, { hint: "半角の英数字" })).toBe("半角の英数字");
});

test("英語はピリオドで文を区切り、簡体字中国語は読点で書式と上限をつなぐ", () => {
  const limits = { minLength: null, maxLength: 2000 };
  const en = createFieldGuide(createI18n("en").t, "en");
  const zh = createFieldGuide(createI18n("zh-Hans").t, "zh-Hans");
  expect(en(limits, { hint: "Use HTTP or HTTPS." })).toBe(
    "Use HTTP or HTTPS. Enter up to 2,000 characters.",
  );
  expect(zh(limits, { hint: "仅限 HTTP 或 HTTPS" })).toBe(
    "仅限 HTTP 或 HTTPS，最多 2,000 个字符",
  );
});
