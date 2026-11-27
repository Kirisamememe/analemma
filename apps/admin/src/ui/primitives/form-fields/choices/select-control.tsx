import { useContext, type ReactNode } from "react";
import { Button, SelectStateContext, SelectValue } from "react-aria-components";
import { useTranslation } from "react-i18next";

import type { SelectInputProps } from "./select-root";

import { fieldControl } from "@/ui/primitives/form-fields/field-control";
import { Icon } from "@/ui/primitives/graphics";
import { ListBoxPopover } from "@/ui/primitives/overlays";
import { typography } from "@/ui/typography";

/** 選択のボタンと選択肢の一覧。 */
export const SelectControl = ({
  options,
  isRequired,
}: Pick<SelectInputProps, "isRequired" | "options">): ReactNode => {
  const { t } = useTranslation();
  const state = useContext(SelectStateContext);
  const placeholder = t("ui.select.placeholder");

  const choices =
    isRequired === true
      ? options
      : [{ value: "", label: t("ui.select.none") }, ...options];

  return (
    <>
      <Button
        className={fieldControl({
          className: [
            "flex h-control items-center justify-between gap-2 px-3 @max-3xs/nested-form:px-1",
            typography({ role: "body" }),
          ],
        })}
        data-invalid={
          state?.displayValidation.isInvalid === true ? true : undefined
        }
      >
        <SelectValue className="min-w-0 flex-1 truncate text-start is-placeholder:text-fg-muted">
          {({ isPlaceholder, selectedText }) =>
            isPlaceholder ? placeholder : selectedText
          }
        </SelectValue>
        <span className="flex text-fg-muted">
          <Icon name="chevron-down" />
        </span>
      </Button>
      <ListBoxPopover options={choices} />
    </>
  );
};
