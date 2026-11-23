import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { PasskeyNameField } from "@/components/passkey-name-field";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

describe("PasskeyNameField", () => {
  test("指定された場合は名前の補足と入力できる文字数の上限を持つこと", () => {
    renderWithI18n(<PasskeyNameField maxLength={64} showDescription />, "ja");

    const field = screen.getByRole("textbox", {
      name: "パスキーの名前",
      description: "パスキーを見分けるための名前(端末の名前など)。",
    });

    expect(field.getAttribute("maxlength")).toBe("64");
  });

  test("名前の変更では今の名前を表示し、補足や入力できる文字数の上限を持たないこと", () => {
    renderWithI18n(<PasskeyNameField defaultValue="MacBook" />, "ja");

    const field = screen.getByRole("textbox", {
      name: "パスキーの名前",
      description: "",
    });

    expect(screen.getByDisplayValue("MacBook")).toBe(field);
    expect(field.getAttribute("maxlength")).toBeNull();
  });
});
